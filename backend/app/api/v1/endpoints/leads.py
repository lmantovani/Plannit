from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, InteracaoLead, StatusFunil, OrigemLead, InteracaoArquiteto, TipoInteracaoArquiteto
from app.schemas.crm import (
    LeadCreate, LeadUpdate, LeadResponse,
    InteracaoCreate, InteracaoResponse, LeadPerderRequest,
    DevolverLeadRequest, ReatribuirLeadRequest,
)
from app.services import fila_atendimento_service, lead_atendimento_service

router = APIRouter(prefix="/leads", tags=["CRM — Leads"])


@router.get("/", response_model=List[LeadResponse])
def listar_leads(
    status_funil: Optional[StatusFunil] = None,
    vendedor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista leads — vendedor vê apenas os seus; gestor vê todos."""
    query = db.query(Lead).filter(Lead.convertido_em_cliente == False)

    # Vendedor só vê sua carteira (SRS Seção 2)
    if current_user.perfil == PerfilUsuario.VENDEDOR:
        query = query.filter(Lead.vendedor_id == current_user.id)
    elif vendedor_id:
        query = query.filter(Lead.vendedor_id == vendedor_id)

    if status_funil:
        query = query.filter(Lead.status_funil == status_funil)

    return query.order_by(Lead.criado_em.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=LeadResponse, status_code=201)
def criar_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cadastra novo lead — RF001. Vendedor só pode atribuir o lead a si mesmo."""
    dados = payload.model_dump()

    if not dados.get("vendedor_id"):
        if current_user.perfil == PerfilUsuario.VENDEDOR:
            dados["vendedor_id"] = current_user.id
    elif current_user.perfil == PerfilUsuario.VENDEDOR and dados["vendedor_id"] != current_user.id:
        raise HTTPException(403, "Vendedor só pode atribuir o lead a si mesmo")

    lead = Lead(**dados, criado_por_id=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)

    if lead.vendedor_id:
        lead_atendimento_service.registrar_primeira_interacao(db, lead, current_user.id)
        if lead.origem == OrigemLead.SHOWROOM:
            fila_atendimento_service.mover_para_final(db, lead.vendedor_id)

    if lead.arquiteto_id:
        tipo = (
            TipoInteracaoArquiteto.VISITA_LOJA
            if lead.origem == OrigemLead.SHOWROOM
            else TipoInteracaoArquiteto.INDICACAO_LEAD
        )
        db.add(InteracaoArquiteto(
            arquiteto_id=lead.arquiteto_id,
            autor_id=current_user.id,
            tipo=tipo,
            observacao=f"Lead gerado: {lead.nome}",
        ))
        db.commit()

    return lead


@router.get("/verificar-duplicado")
def verificar_duplicado(
    telefone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aviso não-bloqueante: verifica se telefone já existe como lead ou cliente."""
    resultado = lead_atendimento_service.verificar_duplicado(db, telefone)
    return {"duplicado": resultado is not None, "existente": resultado}


@router.get("/aguardando")
def listar_aguardando(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fluxo 2 — leads sem vendedor, mais antigo primeiro. Recalcula alerta visual
    e dispara escalonamento na leitura (sem job agendado)."""
    fila_atendimento_service.escalonar_leads_aguardando(db)
    config = fila_atendimento_service.get_config(db)
    agora = datetime.now(timezone.utc)

    leads = (
        db.query(Lead)
        .filter(Lead.vendedor_id.is_(None))
        .order_by(Lead.criado_em.asc(), Lead.id.asc())
        .all()
    )

    resultado = []
    for lead in leads:
        criado = lead.criado_em if lead.criado_em.tzinfo else lead.criado_em.replace(tzinfo=timezone.utc)
        minutos_esperando = int((agora - criado).total_seconds() / 60)
        resultado.append({
            "id": lead.id,
            "nome": lead.nome,
            "telefone": lead.telefone,
            "origem": lead.origem,
            "arquiteto_id": lead.arquiteto_id,
            "criado_em": lead.criado_em.isoformat(),
            "minutos_esperando": minutos_esperando,
            "alerta": minutos_esperando >= config.minutos_alerta,
        })
    return resultado


@router.get("/{lead_id}", response_model=LeadResponse)
def obter_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
def atualizar_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/perder", response_model=LeadResponse)
def marcar_perdido(
    lead_id: int,
    payload: LeadPerderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RF004 — Exige motivo ao marcar lead como Perdido (RN001)."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    lead.status_funil = StatusFunil.PERDIDO
    lead.motivo_perda = payload.motivo_perda
    lead.concorrente_perdido = payload.concorrente
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/qualificar", response_model=LeadResponse)
def qualificar_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RN001 — Registra qualificação antes de avançar para briefing."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    lead.qualificado = True
    lead.status_funil = StatusFunil.EM_VISITA
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/puxar", response_model=LeadResponse)
def puxar_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fluxo 2 (redes sociais/telefone) — só é permitido puxar o lead mais antigo."""
    if current_user.perfil != PerfilUsuario.VENDEDOR:
        raise HTTPException(403, "Apenas vendedores podem puxar leads da fila")
    return lead_atendimento_service.puxar_lead(db, lead_id, current_user.id)


@router.post("/{lead_id}/devolver", response_model=LeadResponse)
def devolver_lead(
    lead_id: int,
    payload: DevolverLeadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_atendimento_service.devolver_lead(db, lead_id, payload.motivo, current_user)


@router.post("/{lead_id}/reatribuir", response_model=LeadResponse)
def reatribuir_lead(
    lead_id: int,
    payload: ReatribuirLeadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)),
):
    return lead_atendimento_service.reatribuir_lead(db, lead_id, payload.vendedor_id, current_user)


# === INTERAÇÕES ===

@router.get("/{lead_id}/interacoes", response_model=List[InteracaoResponse])
def listar_interacoes(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RF003 — Histórico completo de interações."""
    return (
        db.query(InteracaoLead)
        .filter(InteracaoLead.lead_id == lead_id)
        .order_by(InteracaoLead.data.desc())
        .all()
    )


@router.post("/{lead_id}/interacoes", response_model=InteracaoResponse, status_code=201)
def registrar_interacao(
    lead_id: int,
    payload: InteracaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RF003 — Registra interação e atualiza última_interacao_em."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    interacao = InteracaoLead(
        lead_id=lead_id,
        responsavel_id=current_user.id,
        tipo=payload.tipo,
        resumo=payload.resumo,
    )
    db.add(interacao)

    # Atualiza timestamp de última interação (RF005 — alerta 3 dias sem interação)
    lead.ultima_interacao_em = datetime.utcnow()
    db.commit()
    db.refresh(interacao)
    return interacao
