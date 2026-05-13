from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, require_roles
from app.models.user import User, PerfilUsuario
from app.schemas.auth import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get("/", response_model=List[UserResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)),
):
    return db.query(User).filter(User.is_active == True).all()


@router.post("/", response_model=UserResponse, status_code=201)
def criar_usuario(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)),
):
    existente = db.query(User).filter(User.email == payload.email).first()
    if existente:
        raise HTTPException(400, "E-mail já cadastrado no sistema")

    user = User(
        nome=payload.nome,
        email=payload.email,
        telefone=payload.telefone,
        hashed_password=get_password_hash(payload.password),
        perfil=payload.perfil,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def atualizar_usuario(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/projetistas/disponibilidade")
def disponibilidade_projetistas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista projetistas com WIP atual e disponibilidade — para alocação na fila."""
    from app.services.wip_service import pode_alocar
    from app.models.projeto import ConfigWIPProjetista

    projetistas = db.query(User).filter(
        User.perfil == PerfilUsuario.PROJETISTA,
        User.is_active == True,
    ).all()

    resultado = []
    for p in projetistas:
        status = pode_alocar(db, p.id)
        resultado.append({
            "id": p.id,
            "nome": p.nome,
            **status,
        })

    return resultado
