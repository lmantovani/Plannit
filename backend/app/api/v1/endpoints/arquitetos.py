from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Arquiteto, DecisorArquiteto, ConcorrenteArquiteto
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
)

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


def _get_arquiteto_ou_404(arquiteto_id: int, db: Session) -> Arquiteto:
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto


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
    concorrente = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.id == concorrente_id, ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not concorrente:
        raise HTTPException(404, "Concorrente não encontrado")

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
    concorrente = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.id == concorrente_id, ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not concorrente:
        raise HTTPException(404, "Concorrente não encontrado")
    db.delete(concorrente)
    db.commit()