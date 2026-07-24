from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.schemas.crm import (
    FilaAtendimentoResponse, MarcarIndisponivelRequest, ReordenarFilaRequest,
    ConfigFilaAtendimentoResponse, ConfigFilaAtendimentoUpdate,
)
from app.services import fila_atendimento_service

router = APIRouter(prefix="/fila-atendimento", tags=["CRM — Fila de Atendimento"])


def _exigir_vendedor(current_user: User):
    if current_user.perfil != PerfilUsuario.VENDEDOR:
        raise HTTPException(403, "Apenas vendedores usam a fila de atendimento presencial")


@router.get("/vendedores", response_model=List[FilaAtendimentoResponse])
def listar_fila_vendedores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return fila_atendimento_service.listar_fila_vendedores(db)


@router.post("/checkin", response_model=FilaAtendimentoResponse)
def checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _exigir_vendedor(current_user)
    return fila_atendimento_service.checkin(db, current_user.id)


@router.post("/checkout", response_model=FilaAtendimentoResponse)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _exigir_vendedor(current_user)
    return fila_atendimento_service.checkout(db, current_user.id)


@router.post("/indisponivel", response_model=FilaAtendimentoResponse)
def marcar_indisponivel(
    payload: MarcarIndisponivelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _exigir_vendedor(current_user)
    return fila_atendimento_service.marcar_indisponivel(
        db, current_user.id, payload.categoria, payload.observacao
    )


@router.post("/disponivel", response_model=FilaAtendimentoResponse)
def marcar_disponivel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _exigir_vendedor(current_user)
    return fila_atendimento_service.marcar_disponivel(db, current_user.id)


PODE_REORDENAR = (PerfilUsuario.RECEPCAO, PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)


@router.patch("/reordenar", response_model=List[FilaAtendimentoResponse])
def reordenar_fila(
    payload: ReordenarFilaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*PODE_REORDENAR)),
):
    return fila_atendimento_service.reordenar(db, payload.ordem)


GESTAO_FILA = (PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL)


@router.get("/config", response_model=ConfigFilaAtendimentoResponse)
def obter_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_FILA)),
):
    return fila_atendimento_service.get_config(db)


@router.patch("/config", response_model=ConfigFilaAtendimentoResponse)
def atualizar_config(
    payload: ConfigFilaAtendimentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_FILA)),
):
    config = fila_atendimento_service.get_config(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.get("/contador-hoje")
def contador_hoje(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"leads_atendidos_hoje": fila_atendimento_service.contador_leads_hoje(db, current_user.id)}


@router.get("/resumo")
def resumo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return fila_atendimento_service.resumo_fila(db)
