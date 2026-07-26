from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, PerfilUsuario
from app.models.colaborador import Departamento, Cargo
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
)

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

_ROLES_MODULO = (PerfilUsuario.RH, PerfilUsuario.DIRETORIA)


# === DEPARTAMENTOS ===

@router.get("/departamentos", response_model=List[DepartamentoResponse])
def listar_departamentos(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    return db.query(Departamento).order_by(Departamento.nome).all()


@router.post("/departamentos", response_model=DepartamentoResponse, status_code=201)
def criar_departamento(
    payload: DepartamentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    departamento = Departamento(**payload.model_dump())
    db.add(departamento)
    db.commit()
    db.refresh(departamento)
    return departamento


@router.put("/departamentos/{departamento_id}", response_model=DepartamentoResponse)
def atualizar_departamento(
    departamento_id: int,
    payload: DepartamentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
    if not departamento:
        raise HTTPException(404, "Departamento não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(departamento, field, value)
    db.commit()
    db.refresh(departamento)
    return departamento


# === CARGOS ===

@router.get("/cargos", response_model=List[CargoResponse])
def listar_cargos(
    departamento_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    query = db.query(Cargo)
    if departamento_id:
        query = query.filter(Cargo.departamento_id == departamento_id)
    return query.order_by(Cargo.nome).all()


@router.post("/cargos", response_model=CargoResponse, status_code=201)
def criar_cargo(
    payload: CargoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    if not db.query(Departamento).filter(Departamento.id == payload.departamento_id).first():
        raise HTTPException(400, "Departamento inválido")
    cargo = Cargo(**payload.model_dump())
    db.add(cargo)
    db.commit()
    db.refresh(cargo)
    return cargo


@router.put("/cargos/{cargo_id}", response_model=CargoResponse)
def atualizar_cargo(
    cargo_id: int,
    payload: CargoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
    if not cargo:
        raise HTTPException(404, "Cargo não encontrado")
    dados = payload.model_dump(exclude_unset=True)
    if "departamento_id" in dados and not db.query(Departamento).filter(Departamento.id == dados["departamento_id"]).first():
        raise HTTPException(400, "Departamento inválido")
    for field, value in dados.items():
        setattr(cargo, field, value)
    db.commit()
    db.refresh(cargo)
    return cargo
