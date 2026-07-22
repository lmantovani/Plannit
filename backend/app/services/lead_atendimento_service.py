"""Serviço de atribuição de leads — primeira interação automática ao ganhar
vendedor. As demais funções (puxar/devolver/reatribuir/duplicado) são
adicionadas nas próximas tarefas deste plano."""
from typing import Optional
from fastapi import HTTPException
from app.models.crm import Lead, InteracaoLead, OrigemLead, Cliente
from app.models.user import User, PerfilUsuario

ORIGEM_LABEL = {
    OrigemLead.INSTAGRAM: "Instagram",
    OrigemLead.INDICACAO: "Indicação",
    OrigemLead.SITE_GOOGLE: "Site/Google",
    OrigemLead.CONSTRUTORA: "Construtora",
    OrigemLead.SHOWROOM: "Showroom",
    OrigemLead.ARQUITETO: "Especificador",
    OrigemLead.WHATSAPP: "WhatsApp",
    OrigemLead.TELEFONE: "Telefone",
    OrigemLead.OUTRO: "Outro",
}


def registrar_primeira_interacao(db, lead: Lead, responsavel_id: int) -> InteracaoLead:
    label = ORIGEM_LABEL.get(lead.origem, "Outro")
    interacao = InteracaoLead(
        lead_id=lead.id,
        responsavel_id=responsavel_id,
        tipo="sistema",
        resumo=f"Lead recebido — origem: {label}",
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao


def verificar_duplicado(db, telefone: str) -> Optional[dict]:
    """Verifica se telefone já existe como lead ou cliente (aviso não-bloqueante)."""
    lead = db.query(Lead).filter(Lead.telefone == telefone).order_by(Lead.criado_em.desc()).first()
    if lead:
        return {"tipo": "lead", "id": lead.id, "nome": lead.nome}
    cliente = db.query(Cliente).filter(Cliente.telefone == telefone).first()
    if cliente:
        return {"tipo": "cliente", "id": cliente.id, "nome": cliente.nome}
    return None


def lead_mais_antigo_aguardando(db) -> Optional[Lead]:
    return (
        db.query(Lead)
        .filter(Lead.vendedor_id.is_(None))
        .order_by(Lead.criado_em.asc(), Lead.id.asc())
        .first()
    )


def puxar_lead(db, lead_id: int, vendedor_id: int) -> Lead:
    # Verificar se o lead existe
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    # Se o lead já foi puxado, detecta corrida
    if lead.vendedor_id is not None:
        raise HTTPException(409, "Este lead já foi puxado por outro vendedor")

    # Verificar se é o lead mais antigo aguardando
    mais_antigo = lead_mais_antigo_aguardando(db)
    if mais_antigo is None or mais_antigo.id != lead_id:
        raise HTTPException(
            400,
            f"Só é possível puxar o lead mais antigo da fila (id={mais_antigo.id if mais_antigo else 'N/A'}: {mais_antigo.nome if mais_antigo else 'N/A'})",
        )

    # UPDATE condicional como safeguard contra race condition
    linhas_afetadas = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.vendedor_id.is_(None))
        .update({"vendedor_id": vendedor_id}, synchronize_session=False)
    )
    if linhas_afetadas == 0:
        db.rollback()
        raise HTTPException(409, "Este lead já foi puxado por outro vendedor")
    db.commit()

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    registrar_primeira_interacao(db, lead, vendedor_id)
    return lead


def devolver_lead(db, lead_id: int, motivo: str, quem_devolveu: User) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    if lead.vendedor_id is None:
        raise HTTPException(400, "Lead já está na fila de aguardando")

    e_gestor = quem_devolveu.perfil in (PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)
    if not e_gestor and lead.vendedor_id != quem_devolveu.id:
        raise HTTPException(403, "Apenas o vendedor responsável ou a gestão podem devolver este lead")

    lead.vendedor_id = None
    db.add(InteracaoLead(
        lead_id=lead.id,
        responsavel_id=quem_devolveu.id,
        tipo="sistema",
        resumo=f"Devolvido à fila: {motivo}",
    ))
    db.commit()
    db.refresh(lead)
    return lead


def reatribuir_lead(db, lead_id: int, novo_vendedor_id: int, quem_reatribuiu: User) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    novo_vendedor = db.query(User).filter(User.id == novo_vendedor_id).first()
    if not novo_vendedor:
        raise HTTPException(404, "Vendedor não encontrado")

    lead.vendedor_id = novo_vendedor_id
    db.add(InteracaoLead(
        lead_id=lead.id,
        responsavel_id=quem_reatribuiu.id,
        tipo="sistema",
        resumo=f"Reatribuído para {novo_vendedor.nome}",
    ))
    db.commit()
    db.refresh(lead)
    return lead
