from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.projeto import Briefing, AmbienteBriefing, FilaProjeto, StatusProjeto, Projeto
from app.services.briefing_score import calcular_score_briefing

router = APIRouter(prefix="/briefings", tags=["Briefing"])


class AmbienteInput(BaseModel):
    tipo: str
    descricao: Optional[str] = None
    medidas_preliminares: Optional[str] = None
    observacoes_especificas: Optional[str] = None


class BriefingCreate(BaseModel):
    projeto_id: int
    cidade_obra: Optional[str] = None
    estado_obra: Optional[str] = None
    endereco_obra: Optional[str] = None
    ambientes: Optional[List[str]] = None
    prazo_desejado: Optional[str] = None
    faixa_investimento_min: Optional[float] = None
    faixa_investimento_max: Optional[float] = None
    estilo_preferido: Optional[str] = None
    observacoes: Optional[str] = None
    referencias_url: Optional[List[str]] = None
    arquiteto_nome: Optional[str] = None
    arquiteto_email: Optional[str] = None
    arquiteto_telefone: Optional[str] = None
    ambientes_detalhados: Optional[List[AmbienteInput]] = None


@router.post("/calcular-score")
def calcular_score(payload: BriefingCreate):
    """Calcula score do briefing sem salvar — para feedback em tempo real ao vendedor."""
    dados = payload.model_dump()
    dados["ambientes_detalhados"] = [a.model_dump() for a in (payload.ambientes_detalhados or [])]
    return calcular_score_briefing(dados)


@router.post("/", status_code=201)
def criar_ou_atualizar_briefing(
    payload: BriefingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Salva briefing como rascunho (não envia para fila ainda)."""
    briefing = db.query(Briefing).filter(Briefing.projeto_id == payload.projeto_id).first()

    dados = payload.model_dump(exclude={"ambientes_detalhados", "projeto_id"})

    if briefing:
        for field, value in dados.items():
            setattr(briefing, field, value)
    else:
        briefing = Briefing(projeto_id=payload.projeto_id, **dados)
        db.add(briefing)
        db.flush()

    # Recria ambientes detalhados
    db.query(AmbienteBriefing).filter(AmbienteBriefing.briefing_id == briefing.id).delete()
    for amb in (payload.ambientes_detalhados or []):
        db.add(AmbienteBriefing(briefing_id=briefing.id, **amb.model_dump()))

    # Calcula score automaticamente
    dados_score = payload.model_dump()
    dados_score["ambientes_detalhados"] = [a.model_dump() for a in (payload.ambientes_detalhados or [])]
    resultado_score = calcular_score_briefing(dados_score)
    briefing.score = resultado_score["score"]
    briefing.score_detalhes = resultado_score["detalhes"]

    db.commit()
    db.refresh(briefing)
    return {"briefing_id": briefing.id, "score": resultado_score}


@router.post("/{briefing_id}/enviar-para-fila")
def enviar_para_fila(
    briefing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    RF008, RF009, RN002 — Valida score e campos obrigatórios antes de enviar para fila.
    Bloqueia se score < mínimo ou campos obrigatórios vazios.
    """
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise HTTPException(404, "Briefing não encontrado")

    if briefing.status != "rascunho":
        raise HTTPException(400, f"Briefing já está com status: {briefing.status}")

    # Recalcula score antes de validar
    dados = {
        "cidade_obra": briefing.cidade_obra,
        "ambientes": briefing.ambientes,
        "prazo_desejado": str(briefing.prazo_desejado) if briefing.prazo_desejado else None,
        "faixa_investimento_min": briefing.faixa_investimento_min,
        "faixa_investimento_max": briefing.faixa_investimento_max,
        "estilo_preferido": briefing.estilo_preferido,
        "observacoes": briefing.observacoes,
        "referencias_url": briefing.referencias_url,
        "arquiteto_nome": briefing.arquiteto_nome,
        "ambientes_detalhados": [
            {"tipo": a.tipo, "medidas_preliminares": a.medidas_preliminares, "descricao": a.descricao}
            for a in briefing.ambientes_detalhados
        ],
        "score_minimo": briefing.score_minimo,
    }
    resultado = calcular_score_briefing(dados)

    # RN002 — Bloqueia se score abaixo do mínimo
    if not resultado["aprovado"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Score insuficiente ({resultado['score']:.0f}/{resultado['score_minimo']:.0f}). Complete os campos obrigatórios.",
                "score": resultado["score"],
                "score_minimo": resultado["score_minimo"],
                "pontos_faltantes": resultado["pontos_faltantes"],
            },
        )

    # Atualiza briefing para enviado
    briefing.status = "enviado"
    briefing.score = resultado["score"]
    briefing.enviado_em = datetime.utcnow()

    # Cria entrada na fila de projetos
    fila_existente = db.query(FilaProjeto).filter(FilaProjeto.projeto_id == briefing.projeto_id).first()
    if not fila_existente:
        fila = FilaProjeto(
            projeto_id=briefing.projeto_id,
            status="aguardando",
        )
        db.add(fila)

    # Atualiza status do projeto
    projeto = db.query(Projeto).filter(Projeto.id == briefing.projeto_id).first()
    if projeto:
        projeto.status = StatusProjeto.NA_FILA
        projeto.ultima_movimentacao = datetime.utcnow()

    db.commit()
    return {
        "message": "Briefing aprovado e enviado para a fila de projetos",
        "score": resultado["score"],
    }


@router.get("/{briefing_id}")
def obter_briefing(
    briefing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise HTTPException(404, "Briefing não encontrado")
    return briefing
