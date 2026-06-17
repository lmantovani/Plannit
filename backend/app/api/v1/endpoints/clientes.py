from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Cliente, Lead, StatusFunil
from app.schemas.crm import ClienteCreate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["CRM — Clientes"])


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    aprovado: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Cliente).filter(Cliente.is_active == True)
    if aprovado is not None:
        query = query.filter(Cliente.cadastro_aprovado == aprovado)
    return query.order_by(Cliente.nome).offset(skip).limit(limit).all()


@router.post("/", response_model=ClienteResponse, status_code=201)
def criar_cliente(
    payload: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.cpf_cnpj:
        existente = db.query(Cliente).filter(Cliente.cpf_cnpj == payload.cpf_cnpj).first()
        if existente:
            raise HTTPException(400, "CPF/CNPJ já cadastrado")

    cliente = Cliente(**payload.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obter_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    return cliente


@router.patch("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(
    cliente_id: int,
    payload: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.post("/{cliente_id}/aprovar-cadastro", response_model=ClienteResponse)
def aprovar_cadastro(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.FINANCEIRO
    )),
):
    """Aprovação financeira do cadastro — desbloqueia criação de projetos."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    if cliente.cadastro_aprovado:
        raise HTTPException(400, "Cadastro já aprovado")

    cliente.cadastro_aprovado = True
    cliente.cadastro_aprovado_por = current_user.id
    cliente.cadastro_aprovado_em = datetime.utcnow()
    db.commit()
    db.refresh(cliente)
    return cliente


@router.post("/{cliente_id}/converter-lead/{lead_id}", response_model=ClienteResponse)
def converter_lead_em_cliente(
    cliente_id: int,
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vincula lead ao cliente convertido e atualiza o funil."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")

    lead.convertido_em_cliente = True
    lead.cliente_id = cliente_id
    lead.status_funil = StatusFunil.FECHADO
    db.commit()
    db.refresh(cliente)
    return cliente
