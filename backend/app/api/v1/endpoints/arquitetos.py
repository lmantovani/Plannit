from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Arquiteto, DecisorArquiteto, ConcorrenteArquiteto, TipoEspecificador, StatusCarteiraEspecificador, HistoricoDonoArquiteto, InteracaoArquiteto, MetaVisitasConsultor, Cliente
from app.models.notificacao import Notificacao, TipoNotificacao
from app.models.projeto import Projeto
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoUpdate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
    ArquitetoScoreResponse, ArquitetoDonoUpdate, HistoricoDonoResponse,
    InteracaoArquitetoCreate, InteracaoArquitetoResponse,
    EspecificadoresKpiResponse,
    MetaVisitasUpsert, MetaVisitasResponse, MinhaMetaResponse,
    ClienteResponse,
)
from app.services import arquiteto_score as score_service

router = APIRouter(prefix="/arquitetos", tags=["CRM — Arquitetos"])


@router.get("/", response_model=List[ArquitetoResponse])
def listar_arquitetos(
    nivel_parceria: Optional[str] = None,
    tipo: Optional[TipoEspecificador] = None,
    status_carteira: Optional[StatusCarteiraEspecificador] = None,
    consultor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Arquiteto).options(joinedload(Arquiteto.consultor)).filter(Arquiteto.is_active == True)
    if nivel_parceria:
        query = query.filter(Arquiteto.nivel_parceria == nivel_parceria)
    if tipo:
        query = query.filter(Arquiteto.tipo == tipo)
    if status_carteira:
        query = query.filter(Arquiteto.status_carteira == status_carteira)
    if consultor_id:
        query = query.filter(Arquiteto.consultor_id == consultor_id)
    return query.order_by(Arquiteto.nome).offset(skip).limit(limit).all()


@router.post("/", response_model=ArquitetoResponse, status_code=201)
def criar_arquiteto(
    payload: ArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    if payload.email:
        existente = db.query(Arquiteto).filter(Arquiteto.email == payload.email).first()
        if existente:
            raise HTTPException(400, "E-mail já cadastrado para outro arquiteto")

    arquiteto = Arquiteto(**payload.model_dump())
    db.add(arquiteto)
    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.get("/kpis", response_model=EspecificadoresKpiResponse)
def kpis_especificadores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agora = datetime.utcnow()
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_ano = agora.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    especificadores_ativos = db.query(Arquiteto).filter(Arquiteto.is_active == True).count()

    def _pct_venda_desde(desde: datetime) -> float:
        total = db.query(func.sum(Projeto.valor_contrato)).filter(
            Projeto.criado_em >= desde, Projeto.arquivado == False
        ).scalar() or 0.0
        com_especificador = db.query(func.sum(Projeto.valor_contrato)).filter(
            Projeto.criado_em >= desde, Projeto.arquivado == False, Projeto.arquiteto_id.isnot(None)
        ).scalar() or 0.0
        if not total:
            return 0.0
        return round((com_especificador / total) * 100, 1)

    atendimentos_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo != "visita_escritorio")
        .count()
    )
    visitas_escritorio_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo == "visita_escritorio")
        .count()
    )

    return {
        "especificadores_ativos": especificadores_ativos,
        "pct_venda_mes": _pct_venda_desde(inicio_mes),
        "pct_venda_ano": _pct_venda_desde(inicio_ano),
        "atendimentos_mes": atendimentos_mes,
        "visitas_escritorio_mes": visitas_escritorio_mes,
    }


@router.get("/metas-visitas", response_model=List[MetaVisitasResponse])
def listar_metas_visitas(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    metas = db.query(MetaVisitasConsultor).options(joinedload(MetaVisitasConsultor.consultor)).all()
    return [
        {
            "id": m.id,
            "consultor_id": m.consultor_id,
            "consultor_nome": m.consultor.nome,
            "meta_visitas_mes": m.meta_visitas_mes,
            "configurado_por_id": m.configurado_por_id,
            "atualizado_em": m.atualizado_em,
        }
        for m in metas
    ]


@router.put("/metas-visitas", response_model=MetaVisitasResponse)
def definir_meta_visitas(
    payload: MetaVisitasUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    consultor = db.query(User).filter(User.id == payload.consultor_id).first()
    if not consultor:
        raise HTTPException(400, "Consultor inválido")

    meta = db.query(MetaVisitasConsultor).filter(MetaVisitasConsultor.consultor_id == payload.consultor_id).first()
    if meta:
        meta.meta_visitas_mes = payload.meta_visitas_mes
        meta.configurado_por_id = current_user.id
    else:
        meta = MetaVisitasConsultor(
            consultor_id=payload.consultor_id,
            meta_visitas_mes=payload.meta_visitas_mes,
            configurado_por_id=current_user.id,
        )
        db.add(meta)
    db.commit()
    db.refresh(meta)

    return {
        "id": meta.id,
        "consultor_id": meta.consultor_id,
        "consultor_nome": consultor.nome,
        "meta_visitas_mes": meta.meta_visitas_mes,
        "configurado_por_id": meta.configurado_por_id,
        "atualizado_em": meta.atualizado_em,
    }


@router.get("/metas-visitas/me", response_model=MinhaMetaResponse)
def minha_meta_visitas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meta = db.query(MetaVisitasConsultor).filter(MetaVisitasConsultor.consultor_id == current_user.id).first()
    meta_valor = meta.meta_visitas_mes if meta else 0

    agora = datetime.utcnow()
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    visitas_realizadas = (
        db.query(InteracaoArquiteto)
        .filter(
            InteracaoArquiteto.responsavel_id == current_user.id,
            InteracaoArquiteto.tipo == "visita_escritorio",
            InteracaoArquiteto.data >= inicio_mes,
        )
        .count()
    )

    return {"meta_visitas_mes": meta_valor, "visitas_realizadas_mes": visitas_realizadas}


@router.get("/{arquiteto_id}", response_model=ArquitetoResponse)
def obter_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto


@router.patch("/{arquiteto_id}/dono", response_model=ArquitetoResponse)
def reatribuir_dono(
    arquiteto_id: int,
    payload: ArquitetoDonoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)

    novo_consultor = db.query(User).filter(User.id == payload.consultor_id, User.is_active == True).first()
    if not novo_consultor:
        raise HTTPException(400, "Consultor inválido")

    consultor_anterior_id = arquiteto.consultor_id
    arquiteto.consultor_id = payload.consultor_id

    db.add(HistoricoDonoArquiteto(
        arquiteto_id=arquiteto.id,
        consultor_anterior_id=consultor_anterior_id,
        consultor_novo_id=payload.consultor_id,
        alterado_por_id=current_user.id,
    ))
    db.add(Notificacao(
        tipo=TipoNotificacao.ESPECIFICADOR_TRANSFERIDO,
        titulo="Novo especificador na sua carteira",
        mensagem=f"Você recebeu {arquiteto.nome} ({arquiteto.tipo.value}) na sua carteira.",
        destinatario_id=payload.consultor_id,
        arquiteto_id=arquiteto.id,
    ))

    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.get("/{arquiteto_id}/historico-dono", response_model=List[HistoricoDonoResponse])
def historico_dono(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    registros = (
        db.query(HistoricoDonoArquiteto)
        .options(
            joinedload(HistoricoDonoArquiteto.consultor_anterior),
            joinedload(HistoricoDonoArquiteto.consultor_novo),
            joinedload(HistoricoDonoArquiteto.alterado_por),
        )
        .filter(HistoricoDonoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(HistoricoDonoArquiteto.alterado_em.desc(), HistoricoDonoArquiteto.id.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "arquiteto_id": r.arquiteto_id,
            "consultor_anterior_id": r.consultor_anterior_id,
            "consultor_anterior_nome": r.consultor_anterior.nome if r.consultor_anterior else None,
            "consultor_novo_id": r.consultor_novo_id,
            "consultor_novo_nome": r.consultor_novo.nome,
            "alterado_por_id": r.alterado_por_id,
            "alterado_por_nome": r.alterado_por.nome if r.alterado_por else None,
            "alterado_em": r.alterado_em,
        }
        for r in registros
    ]


@router.patch("/{arquiteto_id}", response_model=ArquitetoResponse)
def atualizar_arquiteto(
    arquiteto_id: int,
    payload: ArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(arquiteto, field, value)

    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.delete("/{arquiteto_id}", status_code=204)
def desativar_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")

    arquiteto.is_active = False
    db.commit()


def _get_arquiteto_ou_404(arquiteto_id: int, db: Session) -> Arquiteto:
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto


@router.get("/{arquiteto_id}/score", response_model=ArquitetoScoreResponse)
def obter_score_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    return score_service.calcular_score(db, arquiteto)


def _get_concorrente_ou_404(arquiteto_id: int, concorrente_id: int, db: Session) -> ConcorrenteArquiteto:
    concorrente = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.id == concorrente_id, ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not concorrente:
        raise HTTPException(404, "Concorrente não encontrado")
    return concorrente


# === DECISORES ===

@router.get("/{arquiteto_id}/decisores", response_model=List[DecisorArquitetoResponse])
def listar_decisores(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.arquiteto_id == arquiteto_id)
        .order_by(DecisorArquiteto.is_principal.desc(), DecisorArquiteto.nome)
        .all()
    )


@router.post("/{arquiteto_id}/decisores", response_model=DecisorArquitetoResponse, status_code=201)
def criar_decisor(
    arquiteto_id: int,
    payload: DecisorArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    _get_arquiteto_ou_404(arquiteto_id, db)

    if payload.is_principal:
        db.query(DecisorArquiteto).filter(
            DecisorArquiteto.arquiteto_id == arquiteto_id
        ).update({"is_principal": False})

    decisor = DecisorArquiteto(arquiteto_id=arquiteto_id, **payload.model_dump())
    db.add(decisor)
    db.commit()
    db.refresh(decisor)
    return decisor


@router.patch("/{arquiteto_id}/decisores/{decisor_id}", response_model=DecisorArquitetoResponse)
def atualizar_decisor(
    arquiteto_id: int,
    decisor_id: int,
    payload: DecisorArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    decisor = (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.id == decisor_id, DecisorArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not decisor:
        raise HTTPException(404, "Decisor não encontrado")

    dados = payload.model_dump(exclude_unset=True)
    if dados.get("is_principal"):
        db.query(DecisorArquiteto).filter(
            DecisorArquiteto.arquiteto_id == arquiteto_id,
            DecisorArquiteto.id != decisor_id,
        ).update({"is_principal": False})

    for field, value in dados.items():
        setattr(decisor, field, value)

    db.commit()
    db.refresh(decisor)
    return decisor


@router.delete("/{arquiteto_id}/decisores/{decisor_id}", status_code=204)
def remover_decisor(
    arquiteto_id: int,
    decisor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    decisor = (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.id == decisor_id, DecisorArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not decisor:
        raise HTTPException(404, "Decisor não encontrado")
    db.delete(decisor)
    db.commit()


# === CONCORRENTES ===

@router.get("/{arquiteto_id}/concorrentes", response_model=List[ConcorrenteArquitetoResponse])
def listar_concorrentes(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .order_by(ConcorrenteArquiteto.percentual_fechamento_estimado.desc())
        .all()
    )


@router.post("/{arquiteto_id}/concorrentes", response_model=ConcorrenteArquitetoResponse, status_code=201)
def criar_concorrente(
    arquiteto_id: int,
    payload: ConcorrenteArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    concorrente = ConcorrenteArquiteto(
        arquiteto_id=arquiteto_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(concorrente)
    db.commit()
    db.refresh(concorrente)
    return concorrente


@router.patch("/{arquiteto_id}/concorrentes/{concorrente_id}", response_model=ConcorrenteArquitetoResponse)
def atualizar_concorrente(
    arquiteto_id: int,
    concorrente_id: int,
    payload: ConcorrenteArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    concorrente = _get_concorrente_ou_404(arquiteto_id, concorrente_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(concorrente, field, value)

    db.commit()
    db.refresh(concorrente)
    return concorrente


@router.delete("/{arquiteto_id}/concorrentes/{concorrente_id}", status_code=204)
def remover_concorrente(
    arquiteto_id: int,
    concorrente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    concorrente = _get_concorrente_ou_404(arquiteto_id, concorrente_id, db)
    db.delete(concorrente)
    db.commit()


# === INTERAÇÕES ===

@router.get("/{arquiteto_id}/interacoes", response_model=List[InteracaoArquitetoResponse])
def listar_interacoes_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(InteracaoArquiteto)
        .options(joinedload(InteracaoArquiteto.responsavel))
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.data.desc(), InteracaoArquiteto.id.desc())
        .all()
    )


@router.post("/{arquiteto_id}/interacoes", response_model=InteracaoArquitetoResponse, status_code=201)
def registrar_interacao_arquiteto(
    arquiteto_id: int,
    payload: InteracaoArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    interacao = InteracaoArquiteto(
        arquiteto_id=arquiteto_id,
        responsavel_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao


# === CLIENTES VINCULADOS ===

@router.get("/{arquiteto_id}/clientes", response_model=List[ClienteResponse])
def listar_clientes_do_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(Cliente)
        .filter(Cliente.arquiteto_id == arquiteto_id)
        .order_by(Cliente.nome)
        .all()
    )