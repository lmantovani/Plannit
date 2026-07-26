from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, PerfilUsuario
from app.models.colaborador import (
    Departamento, Cargo, Colaborador, HistoricoSalarialColaborador, HistoricoCargoColaborador,
)
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
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


# === COLABORADORES ===

@router.get("/", response_model=List[ColaboradorResponse])
def listar_colaboradores(
    departamento_id: Optional[int] = None,
    cargo_id: Optional[int] = None,
    regime: Optional[str] = None,
    is_active: Optional[bool] = None,
    busca: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    query = db.query(Colaborador)
    if departamento_id:
        query = query.filter(Colaborador.departamento_id == departamento_id)
    if cargo_id:
        query = query.filter(Colaborador.cargo_id == cargo_id)
    if regime:
        query = query.filter(Colaborador.regime == regime)
    if is_active is not None:
        query = query.filter(Colaborador.is_active == is_active)
    if busca:
        query = query.filter(Colaborador.nome.ilike(f"%{busca}%"))
    return query.order_by(Colaborador.nome).all()


@router.post("/", response_model=ColaboradorResponse, status_code=201)
def criar_colaborador(
    payload: ColaboradorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    if db.query(Colaborador).filter(Colaborador.cpf == payload.cpf).first():
        raise HTTPException(400, "CPF já cadastrado para outro colaborador")
    if not db.query(Cargo).filter(Cargo.id == payload.cargo_id).first():
        raise HTTPException(400, "Cargo inválido")
    if not db.query(Departamento).filter(Departamento.id == payload.departamento_id).first():
        raise HTTPException(400, "Departamento inválido")
    if payload.gestor_id and not db.query(Colaborador).filter(Colaborador.id == payload.gestor_id).first():
        raise HTTPException(400, "Gestor inválido")

    colaborador = Colaborador(**payload.model_dump())
    db.add(colaborador)
    db.commit()
    db.refresh(colaborador)

    if colaborador.salario_clt is not None:
        db.add(HistoricoSalarialColaborador(
            colaborador_id=colaborador.id,
            salario_clt=colaborador.salario_clt,
            remuneracao_complementar=colaborador.remuneracao_complementar,
            data_vigencia=colaborador.data_vigencia_salario or colaborador.data_admissao,
            motivo="Admissão",
            registrado_por_id=current_user.id,
        ))

    db.add(HistoricoCargoColaborador(
        colaborador_id=colaborador.id,
        cargo_anterior_id=None,
        cargo_novo_id=colaborador.cargo_id,
        data=colaborador.data_admissao,
        aprovado_por_id=current_user.id,
        justificativa="Admissão",
    ))
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.get("/{colaborador_id}", response_model=ColaboradorResponse)
def obter_colaborador(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    return _get_colaborador_ou_404(colaborador_id, db)


@router.put("/{colaborador_id}", response_model=ColaboradorResponse)
def atualizar_colaborador(
    colaborador_id: int,
    payload: ColaboradorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(colaborador, field, value)
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.post("/{colaborador_id}/historico-salarial", response_model=HistoricoSalarialResponse, status_code=201)
def lancar_historico_salarial(
    colaborador_id: int,
    payload: HistoricoSalarialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)

    registro = HistoricoSalarialColaborador(
        colaborador_id=colaborador_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(registro)

    colaborador.salario_clt = payload.salario_clt
    colaborador.remuneracao_complementar = payload.remuneracao_complementar
    colaborador.data_vigencia_salario = payload.data_vigencia

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{colaborador_id}/historico-salarial", response_model=List[HistoricoSalarialResponse])
def listar_historico_salarial(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    return (
        db.query(HistoricoSalarialColaborador)
        .filter(HistoricoSalarialColaborador.colaborador_id == colaborador_id)
        .order_by(HistoricoSalarialColaborador.data_vigencia.desc(), HistoricoSalarialColaborador.id.desc())
        .all()
    )


def _get_colaborador_ou_404(colaborador_id: int, db: Session) -> Colaborador:
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(404, "Colaborador não encontrado")
    return colaborador
