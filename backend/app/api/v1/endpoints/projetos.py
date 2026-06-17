from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.projeto import Projeto, StatusProjeto, HistoricoStatusProjeto
from app.models.crm import Cliente

router = APIRouter(prefix="/projetos", tags=["Projetos"])


# === SCHEMAS LOCAIS ===

class ProjetoCreate(BaseModel):
    cliente_id: int
    vendedor_id: Optional[int] = None
    projetista_id: Optional[int] = None
    arquiteto_id: Optional[int] = None
    valor_contrato: Optional[float] = None
    prazo_entrega_estimado: Optional[date] = None


class ProjetoUpdate(BaseModel):
    vendedor_id: Optional[int] = None
    projetista_id: Optional[int] = None
    conferente_id: Optional[int] = None
    arquiteto_id: Optional[int] = None
    valor_contrato: Optional[float] = None
    prazo_entrega_estimado: Optional[date] = None


class StatusChangeRequest(BaseModel):
    status: StatusProjeto
    observacao: Optional[str] = None


# === HELPERS ===

def _gerar_codigo(db: Session) -> str:
    ano = datetime.utcnow().year
    total = db.query(Projeto).count()
    return f"PROJ-{ano}-{total + 1:04d}"


# === ENDPOINTS ===

@router.get("/")
def listar_projetos(
    status: Optional[StatusProjeto] = None,
    vendedor_id: Optional[int] = None,
    projetista_id: Optional[int] = None,
    cliente_id: Optional[int] = None,
    arquivado: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Projeto).filter(Projeto.arquivado == arquivado)

    if current_user.perfil == PerfilUsuario.VENDEDOR:
        query = query.filter(Projeto.vendedor_id == current_user.id)
    elif current_user.perfil == PerfilUsuario.PROJETISTA:
        query = query.filter(Projeto.projetista_id == current_user.id)
    else:
        if vendedor_id:
            query = query.filter(Projeto.vendedor_id == vendedor_id)
        if projetista_id:
            query = query.filter(Projeto.projetista_id == projetista_id)

    if status:
        query = query.filter(Projeto.status == status)
    if cliente_id:
        query = query.filter(Projeto.cliente_id == cliente_id)

    return query.order_by(Projeto.criado_em.desc()).offset(skip).limit(limit).all()


@router.post("/", status_code=201)
def criar_projeto(
    payload: ProjetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    if not cliente.cadastro_aprovado:
        raise HTTPException(400, "Cadastro do cliente ainda não aprovado pelo financeiro")

    projeto = Projeto(
        codigo=_gerar_codigo(db),
        **payload.model_dump(),
    )
    if not projeto.vendedor_id and current_user.perfil == PerfilUsuario.VENDEDOR:
        projeto.vendedor_id = current_user.id

    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return projeto


@router.get("/{projeto_id}")
def obter_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(404, "Projeto não encontrado")
    return projeto


@router.patch("/{projeto_id}")
def atualizar_projeto(
    projeto_id: int,
    payload: ProjetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(404, "Projeto não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(projeto, field, value)

    db.commit()
    db.refresh(projeto)
    return projeto


@router.post("/{projeto_id}/status")
def mudar_status(
    projeto_id: int,
    payload: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Muda status do projeto e registra no histórico imutável."""
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(404, "Projeto não encontrado")
    if projeto.arquivado:
        raise HTTPException(400, "Projeto arquivado não pode ter status alterado")

    historico = HistoricoStatusProjeto(
        projeto_id=projeto_id,
        status_de=projeto.status,
        status_para=payload.status,
        alterado_por_id=current_user.id,
        observacao=payload.observacao,
    )
    db.add(historico)

    projeto.status_anterior = projeto.status
    projeto.status = payload.status
    projeto.status_alterado_em = datetime.utcnow()
    projeto.status_alterado_por = current_user.id
    projeto.ultima_movimentacao = datetime.utcnow()

    db.commit()
    db.refresh(projeto)
    return projeto


@router.get("/{projeto_id}/historico")
def historico_status(
    projeto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(404, "Projeto não encontrado")

    return (
        db.query(HistoricoStatusProjeto)
        .filter(HistoricoStatusProjeto.projeto_id == projeto_id)
        .order_by(HistoricoStatusProjeto.criado_em.desc())
        .all()
    )


@router.post("/{projeto_id}/arquivar")
def arquivar_projeto(
    projeto_id: int,
    motivo: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    """RN017 — Projetos nunca são deletados, apenas arquivados."""
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(404, "Projeto não encontrado")
    if projeto.arquivado:
        raise HTTPException(400, "Projeto já está arquivado")

    projeto.arquivado = True
    projeto.arquivado_em = datetime.utcnow()
    projeto.arquivado_motivo = motivo
    db.commit()
    return {"message": "Projeto arquivado com sucesso"}
