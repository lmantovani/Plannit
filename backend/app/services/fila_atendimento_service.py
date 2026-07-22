"""Serviço de fila de atendimento presencial — check-in/check-out de vendedores,
indisponibilidade e reordenação. Sem job agendado: "ativo hoje" é recalculado a
cada leitura comparando data_referencia com a data atual, e não por um processo
rodando sozinho em background (decisão de 2026-07-21 — ver plano da Frente A)."""
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.crm import FilaAtendimento, ConfigFilaAtendimento, MotivoIndisponibilidade, Lead
from app.models.user import User, PerfilUsuario
from app.models.notificacao import Notificacao, TipoNotificacao


def get_config(db: Session) -> ConfigFilaAtendimento:
    config = db.query(ConfigFilaAtendimento).first()
    if not config:
        config = ConfigFilaAtendimento(minutos_alerta=15, minutos_escalonamento=30)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def _proxima_posicao(db: Session) -> int:
    maior = db.query(FilaAtendimento).order_by(FilaAtendimento.posicao.desc()).first()
    return (maior.posicao + 1) if maior else 1


def _get_fila_ou_404(db: Session, vendedor_id: int) -> FilaAtendimento:
    fila = db.query(FilaAtendimento).filter(FilaAtendimento.vendedor_id == vendedor_id).first()
    if not fila:
        raise HTTPException(404, "Faça check-in antes de usar a fila de atendimento")
    return fila


def checkin(db: Session, vendedor_id: int) -> FilaAtendimento:
    fila = db.query(FilaAtendimento).filter(FilaAtendimento.vendedor_id == vendedor_id).first()
    agora = datetime.now(timezone.utc)
    if not fila:
        fila = FilaAtendimento(vendedor_id=vendedor_id, posicao=_proxima_posicao(db))
        db.add(fila)
    else:
        fila.posicao = _proxima_posicao(db)
    fila.disponivel = True
    fila.motivo_indisponivel_categoria = None
    fila.motivo_indisponivel_obs = None
    fila.checkin_em = agora
    fila.ativo_hoje = True
    fila.data_referencia = agora.date()
    db.commit()
    db.refresh(fila)
    return fila


def checkout(db: Session, vendedor_id: int) -> FilaAtendimento:
    fila = _get_fila_ou_404(db, vendedor_id)
    fila.ativo_hoje = False
    db.commit()
    db.refresh(fila)
    return fila


def marcar_indisponivel(
    db: Session, vendedor_id: int, categoria: MotivoIndisponibilidade, observacao: Optional[str]
) -> FilaAtendimento:
    fila = _get_fila_ou_404(db, vendedor_id)
    fila.disponivel = False
    fila.motivo_indisponivel_categoria = categoria
    fila.motivo_indisponivel_obs = observacao
    db.commit()
    db.refresh(fila)
    return fila


def marcar_disponivel(db: Session, vendedor_id: int) -> FilaAtendimento:
    fila = _get_fila_ou_404(db, vendedor_id)
    fila.disponivel = True
    fila.motivo_indisponivel_categoria = None
    fila.motivo_indisponivel_obs = None
    db.commit()
    db.refresh(fila)
    return fila


def listar_fila_vendedores(db: Session) -> list[FilaAtendimento]:
    """"Ativo hoje" é recalculado na leitura: só conta quem tem ativo_hoje=True
    E data_referencia igual à data atual — evita depender de um job de reset
    à meia-noite (quem não fizer novo check-in simplesmente some da lista)."""
    hoje = datetime.now(timezone.utc).date()
    return (
        db.query(FilaAtendimento)
        .filter(FilaAtendimento.ativo_hoje == True, FilaAtendimento.data_referencia == hoje)
        .order_by(FilaAtendimento.posicao.asc())
        .all()
    )


def mover_para_final(db: Session, vendedor_id: int) -> None:
    """Fim do atendimento presencial: vendedor atribuído volta pro final da fila.
    No-op se o vendedor não tiver feito check-in (não há posição a mover)."""
    fila = db.query(FilaAtendimento).filter(FilaAtendimento.vendedor_id == vendedor_id).first()
    if not fila:
        return
    fila.posicao = _proxima_posicao(db)
    db.commit()


def reordenar(db: Session, ordem_vendedor_ids: list[int]) -> list[FilaAtendimento]:
    """Escopo restrito aos registros "ativos hoje" (mesmo filtro de
    listar_fila_vendedores): vendedores com check-out feito ou de dias
    anteriores não devem ser exigidos na lista para reordenar a fila atual."""
    filas = listar_fila_vendedores(db)
    ids_existentes = {f.vendedor_id for f in filas}
    if set(ordem_vendedor_ids) != ids_existentes:
        raise HTTPException(400, "A lista precisa conter exatamente todos os vendedores da fila")

    por_vendedor = {f.vendedor_id: f for f in filas}
    for posicao, vendedor_id in enumerate(ordem_vendedor_ids, start=1):
        por_vendedor[vendedor_id].posicao = posicao
    db.commit()
    return listar_fila_vendedores(db)


def escalonar_leads_aguardando(db: Session) -> int:
    """Verifica leads aguardando há mais tempo que o limiar configurado e cria
    uma Notificacao para recepção/gestão — uma única vez por lead (idempotente,
    checado via dados_extras.lead_id). Chamado na leitura de GET /leads/aguardando,
    não por um job agendado (ver Global Constraints deste plano)."""
    config = get_config(db)
    limite = datetime.now(timezone.utc) - timedelta(minutes=config.minutos_escalonamento)

    candidatos = db.query(Lead).filter(Lead.vendedor_id.is_(None), Lead.criado_em < limite).all()
    if not candidatos:
        return 0

    ja_notificados = {
        n.dados_extras.get("lead_id")
        for n in db.query(Notificacao)
        .filter(Notificacao.tipo == TipoNotificacao.LEAD_AGUARDANDO_ESCALONADO)
        .all()
        if n.dados_extras
    }

    destinatarios = (
        db.query(User)
        .filter(
            User.perfil.in_([PerfilUsuario.RECEPCAO, PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL]),
            User.is_active == True,
        )
        .all()
    )

    escalonados = 0
    for lead in candidatos:
        if lead.id in ja_notificados:
            continue
        for destinatario in destinatarios:
            db.add(Notificacao(
                tipo=TipoNotificacao.LEAD_AGUARDANDO_ESCALONADO,
                titulo="Lead aguardando há muito tempo",
                mensagem=f"{lead.nome} está aguardando atendimento há mais de {config.minutos_escalonamento} minutos.",
                destinatario_id=destinatario.id,
                dados_extras={"lead_id": lead.id},
            ))
        escalonados += 1
    if escalonados:
        db.commit()
    return escalonados
