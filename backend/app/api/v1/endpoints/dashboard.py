from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, StatusFunil
from app.models.projeto import Projeto, StatusProjeto, FilaProjeto

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/gestor")
def dashboard_gestor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    US001, US002 — Dashboard gerencial completo.
    Gestor vê todos os projetos, alertas e KPIs sem perguntar para ninguém.
    """
    hoje = datetime.utcnow()
    cinco_dias_atras = hoje - timedelta(days=5)

    # Contagem de projetos por status
    projetos_por_status = (
        db.query(Projeto.status, func.count(Projeto.id))
        .filter(Projeto.arquivado == False)
        .group_by(Projeto.status)
        .all()
    )
    status_map = {s: c for s, c in projetos_por_status}

    # Projetos parados > 5 dias úteis — RN016
    projetos_parados = (
        db.query(Projeto)
        .filter(
            Projeto.arquivado == False,
            Projeto.ultima_movimentacao < cinco_dias_atras,
            Projeto.status.notin_([StatusProjeto.CONCLUIDO, StatusProjeto.CANCELADO]),
        )
        .count()
    )

    # Total de projetos ativos
    total_ativos = (
        db.query(Projeto)
        .filter(
            Projeto.arquivado == False,
            Projeto.status.notin_([StatusProjeto.CONCLUIDO, StatusProjeto.CANCELADO]),
        )
        .count()
    )

    # Leads no funil
    leads_por_status = (
        db.query(Lead.status_funil, func.count(Lead.id))
        .filter(Lead.convertido_em_cliente == False)
        .group_by(Lead.status_funil)
        .all()
    )
    leads_map = {s: c for s, c in leads_por_status}

    # Taxa de conversão Lead → Fechamento (KPI Comercial)
    total_leads = db.query(Lead).count()
    leads_fechados = db.query(Lead).filter(Lead.status_funil == StatusFunil.FECHADO).count()
    taxa_conversao = round((leads_fechados / total_leads * 100), 1) if total_leads > 0 else 0

    # Fila de projetos aguardando alocação
    na_fila = db.query(FilaProjeto).filter(FilaProjeto.status == "aguardando").count()

    return {
        "resumo": {
            "projetos_ativos": total_ativos,
            "projetos_parados_alerta": projetos_parados,
            "leads_total": total_leads,
            "taxa_conversao_pct": taxa_conversao,
            "projetos_na_fila": na_fila,
        },
        "projetos_por_status": status_map,
        "funil_leads": leads_map,
        "alertas": {
            "projetos_parados": projetos_parados > 0,
            "projetos_parados_count": projetos_parados,
        },
        "gerado_em": hoje.isoformat(),
    }


@router.get("/comercial")
def dashboard_comercial(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """KPIs do painel comercial — SRS Seção 9.1"""
    hoje = datetime.utcnow()
    inicio_mes = hoje.replace(day=1, hour=0, minute=0, second=0)
    trinta_dias = hoje - timedelta(days=30)

    # Leads do mês
    leads_mes = db.query(Lead).filter(Lead.criado_em >= inicio_mes).count()
    fechamentos_mes = (
        db.query(Lead)
        .filter(Lead.status_funil == StatusFunil.FECHADO, Lead.criado_em >= inicio_mes)
        .count()
    )

    # Conversão por origem
    conversao_origem = (
        db.query(Lead.origem, func.count(Lead.id).label("total"))
        .group_by(Lead.origem)
        .all()
    )

    # Leads perdidos com motivo
    perdidos_mes = (
        db.query(Lead)
        .filter(Lead.status_funil == StatusFunil.PERDIDO, Lead.criado_em >= trinta_dias)
        .count()
    )

    return {
        "leads_mes": leads_mes,
        "fechamentos_mes": fechamentos_mes,
        "taxa_conversao_mes": round((fechamentos_mes / leads_mes * 100), 1) if leads_mes > 0 else 0,
        "perdidos_30_dias": perdidos_mes,
        "leads_por_origem": [{"origem": o, "total": t} for o, t in conversao_origem],
        "gerado_em": hoje.isoformat(),
    }


@router.get("/projetos-ativos")
def projetos_ativos_completo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista completa de projetos ativos com alertas — para a tela principal do gestor."""
    cinco_dias_atras = datetime.utcnow() - timedelta(days=5)

    projetos = (
        db.query(Projeto)
        .filter(
            Projeto.arquivado == False,
            Projeto.status.notin_([StatusProjeto.CONCLUIDO, StatusProjeto.CANCELADO]),
        )
        .order_by(Projeto.ultima_movimentacao.asc())
        .limit(50)
        .all()
    )

    resultado = []
    for p in projetos:
        parado = p.ultima_movimentacao and p.ultima_movimentacao < cinco_dias_atras
        resultado.append({
            "id": p.id,
            "codigo": p.codigo,
            "cliente": p.cliente.nome if p.cliente else None,
            "status": p.status,
            "vendedor": p.vendedor.nome if p.vendedor else None,
            "ultima_movimentacao": p.ultima_movimentacao.isoformat() if p.ultima_movimentacao else None,
            "alerta_parado": parado,
        })

    return resultado
