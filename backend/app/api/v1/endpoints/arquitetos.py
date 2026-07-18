from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import (
    Arquiteto, DecisorArquiteto, ConcorrenteArquiteto, TipoArquiteto,
    Cliente, InteracaoArquiteto, FuncionarioArquiteto,
)
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoUpdate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
    ArquitetoScoreResponse,
    ClienteResponse,
    InteracaoArquitetoCreate, InteracaoArquitetoResponse,
    FuncionarioArquitetoCreate, FuncionarioArquitetoUpdate, FuncionarioArquitetoResponse,
)
from app.services import arquiteto_score as score_service

router = APIRouter(prefix="/arquitetos", tags=["CRM — Arquitetos"])

GESTAO_ARQUITETOS = (PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO)


def _checar_acesso_relacionamento(arquiteto: Arquiteto, user: User):
    """Diretoria/Gerente/Recepção sempre podem. Vendedor só se for o vinculado."""
    if user.perfil in GESTAO_ARQUITETOS:
        return
    if user.perfil == PerfilUsuario.VENDEDOR and arquiteto.vendedor_id == user.id:
        return
    raise HTTPException(403, "Sem permissão para esta ação")


@router.get("/", response_model=List[ArquitetoResponse])
def listar_arquitetos(
    nivel_parceria: Optional[str] = None,
    tipo: Optional[TipoArquiteto] = None,
    vendedor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Arquiteto).filter(Arquiteto.is_active == True)
    if nivel_parceria:
        query = query.filter(Arquiteto.nivel_parceria == nivel_parceria)
    if tipo:
        query = query.filter(Arquiteto.tipo == tipo)
    if vendedor_id:
        query = query.filter(Arquiteto.vendedor_id == vendedor_id)
    return query.order_by(Arquiteto.nome).offset(skip).limit(limit).all()


@router.post("/", response_model=ArquitetoResponse, status_code=201)
def criar_arquiteto(
    payload: ArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_ARQUITETOS)),
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
    payload: ArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_ARQUITETOS)),
):
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")

    dados = payload.model_dump(exclude_unset=True)
    if "vendedor_id" in dados and current_user.perfil not in (
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    ):
        raise HTTPException(403, "Apenas Diretoria ou Gerente podem definir o vendedor vinculado")

    for field, value in dados.items():
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


# === HISTÓRICO DE INTERAÇÕES ===

@router.get("/{arquiteto_id}/interacoes", response_model=List[InteracaoArquitetoResponse])
def listar_interacoes(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.criado_em.desc(), InteracaoArquiteto.id.desc())
        .all()
    )


@router.post("/{arquiteto_id}/interacoes", response_model=InteracaoArquitetoResponse, status_code=201)
def registrar_interacao(
    arquiteto_id: int,
    payload: InteracaoArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    _checar_acesso_relacionamento(arquiteto, current_user)

    interacao = InteracaoArquiteto(
        arquiteto_id=arquiteto_id,
        autor_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao


# === FUNCIONÁRIOS DO ESCRITÓRIO ===

@router.get("/{arquiteto_id}/funcionarios", response_model=List[FuncionarioArquitetoResponse])
def listar_funcionarios(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(FuncionarioArquiteto)
        .filter(FuncionarioArquiteto.arquiteto_id == arquiteto_id)
        .order_by(FuncionarioArquiteto.nome)
        .all()
    )


@router.post("/{arquiteto_id}/funcionarios", response_model=FuncionarioArquitetoResponse, status_code=201)
def criar_funcionario(
    arquiteto_id: int,
    payload: FuncionarioArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = FuncionarioArquiteto(arquiteto_id=arquiteto_id, **payload.model_dump())
    db.add(funcionario)
    db.commit()
    db.refresh(funcionario)
    return funcionario


@router.patch("/{arquiteto_id}/funcionarios/{funcionario_id}", response_model=FuncionarioArquitetoResponse)
def atualizar_funcionario(
    arquiteto_id: int,
    funcionario_id: int,
    payload: FuncionarioArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = db.query(FuncionarioArquiteto).filter(
        FuncionarioArquiteto.id == funcionario_id,
        FuncionarioArquiteto.arquiteto_id == arquiteto_id,
    ).first()
    if not funcionario:
        raise HTTPException(404, "Funcionário não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(funcionario, field, value)
    db.commit()
    db.refresh(funcionario)
    return funcionario


@router.delete("/{arquiteto_id}/funcionarios/{funcionario_id}", status_code=204)
def remover_funcionario(
    arquiteto_id: int,
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = db.query(FuncionarioArquiteto).filter(
        FuncionarioArquiteto.id == funcionario_id,
        FuncionarioArquiteto.arquiteto_id == arquiteto_id,
    ).first()
    if not funcionario:
        raise HTTPException(404, "Funcionário não encontrado")
    db.delete(funcionario)
    db.commit()


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