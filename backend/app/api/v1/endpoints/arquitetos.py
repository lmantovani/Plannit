from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Arquiteto
from app.schemas.crm import ArquitetoCreate, ArquitetoResponse

router = APIRouter(prefix="/arquitetos", tags=["CRM — Arquitetos"])


@router.get("/", response_model=List[ArquitetoResponse])
def listar_arquitetos(
    nivel_parceria: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Arquiteto).filter(Arquiteto.is_active == True)
    if nivel_parceria:
        query = query.filter(Arquiteto.nivel_parceria == nivel_parceria)
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


@router.patch("/{arquiteto_id}", response_model=ArquitetoResponse)
def atualizar_arquiteto(
    arquiteto_id: int,
    payload: ArquitetoCreate,
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