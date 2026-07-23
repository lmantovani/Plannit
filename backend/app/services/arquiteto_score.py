"""
Serviço de Score de Arquitetos — RFV x Potencial x Lealdade.
Critérios de pontuação são faixas fixas (mesmo padrão de app/services/briefing_score.py),
não percentil relativo entre arquitetos. Limiares numéricos ficam como constantes
nomeadas abaixo, ajustáveis sem reescrever a lógica.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from app.models.crm import Arquiteto, Lead, StatusFunil, ConcorrenteArquiteto
from app.models.projeto import Projeto, StatusProjeto


def pontuar_recencia(dias_desde_ultimo_projeto: Optional[int]) -> int:
    if dias_desde_ultimo_projeto is None:
        return 0
    if dias_desde_ultimo_projeto <= 30:
        return 100
    if dias_desde_ultimo_projeto <= 90:
        return 70
    if dias_desde_ultimo_projeto <= 180:
        return 40
    if dias_desde_ultimo_projeto <= 365:
        return 20
    return 5


def pontuar_frequencia(qtd_projetos_12_meses: int) -> int:
    if qtd_projetos_12_meses <= 0:
        return 0
    if qtd_projetos_12_meses == 1:
        return 30
    if qtd_projetos_12_meses <= 3:
        return 60
    if qtd_projetos_12_meses <= 6:
        return 85
    return 100


def pontuar_valor(soma_valor_contratos_12_meses: Optional[float]) -> int:
    if not soma_valor_contratos_12_meses or soma_valor_contratos_12_meses <= 0:
        return 0
    if soma_valor_contratos_12_meses < 50_000:
        return 30
    if soma_valor_contratos_12_meses < 150_000:
        return 55
    if soma_valor_contratos_12_meses < 350_000:
        return 75
    if soma_valor_contratos_12_meses < 700_000:
        return 90
    return 100


def calcular_rfv(recencia: float, frequencia: float, valor: float) -> float:
    return round((recencia + frequencia + valor) / 3, 1)


def pontuar_potencial(qtd_leads_e_projetos_ativos: int) -> int:
    if qtd_leads_e_projetos_ativos <= 0:
        return 0
    if qtd_leads_e_projetos_ativos == 1:
        return 40
    if qtd_leads_e_projetos_ativos <= 3:
        return 65
    if qtd_leads_e_projetos_ativos <= 6:
        return 85
    return 100


def pontuar_tempo_parceria(meses_desde_cadastro: int) -> int:
    if meses_desde_cadastro < 3:
        return 20
    if meses_desde_cadastro < 12:
        return 50
    if meses_desde_cadastro < 24:
        return 75
    return 100


def pontuar_consistencia(meses_com_projeto_ultimos_12: int) -> float:
    meses = max(0, min(12, meses_com_projeto_ultimos_12))
    return round((meses / 12) * 100, 1)


def pontuar_taxa_conversao(leads_fechados: int, leads_perdidos: int, leads_desqualificados: int) -> float:
    total_terminal = leads_fechados + leads_perdidos + leads_desqualificados
    if total_terminal == 0:
        return 50.0
    return round((leads_fechados / total_terminal) * 100, 1)


def calcular_lealdade(tempo_parceria: float, consistencia: float, taxa_conversao: float) -> float:
    return round((tempo_parceria + consistencia + taxa_conversao) / 3, 1)


def calcular_score_geral(rfv: float, potencial: float, lealdade: float) -> float:
    return round((rfv + potencial + lealdade) / 3, 1)


def _utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Normaliza para timezone-aware UTC. SQLite (usado nos testes) devolve datetimes
    naive mesmo para colunas `DateTime(timezone=True)`; Postgres devolve aware. Sem isso,
    subtrair/comparar com `agora` (aware) explode com `TypeError` num dos dois ambientes."""
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def meses_entre(inicio: Optional[datetime], fim: datetime) -> int:
    if inicio is None:
        return 0
    meses = (fim.year - inicio.year) * 12 + (fim.month - inicio.month)
    if fim.day < inicio.day:
        meses -= 1
    return meses


def contar_meses_distintos(datas: Iterable[Optional[datetime]]) -> int:
    chaves = {(d.year, d.month) for d in datas if d is not None}
    return len(chaves)


def determinar_segmento(
    *,
    tem_historico: bool,
    dias_desde_cadastro: int,
    em_risco: bool,
    score_geral: float,
    rfv: float,
    potencial: float,
    lealdade: float,
) -> str:
    if not tem_historico:
        return "inativo"
    if dias_desde_cadastro < 90:
        return "novo_promissor"
    if em_risco:
        return "em_risco"
    if score_geral >= 85:
        return "campeao"
    if lealdade >= 75 and rfv >= 50:
        return "parceiro_fiel"
    if potencial >= 70:
        return "em_ascensao"
    return "ocasional"


def determinar_flags(
    *,
    score_geral: float,
    potencial: float,
    valor_pontos: float,
    em_risco: bool,
) -> list[str]:
    flags = []
    if score_geral >= 85:
        flags.append("top_indicador")
    if em_risco:
        flags.append("em_risco_de_perda")
    if potencial >= 70:
        flags.append("alto_potencial")
    if valor_pontos >= 90:
        flags.append("indicacao_alto_valor")
    return flags


def calcular_risco_concorrencia(percentuais: list[float]) -> dict:
    maior = max(percentuais) if percentuais else 0.0
    if maior < 30:
        nivel = "baixo"
    elif maior <= 60:
        nivel = "medio"
    else:
        nivel = "alto"
    return {"risco": round(maior, 1), "nivel": nivel}


LEADS_STATUS_TERMINAL = {StatusFunil.FECHADO, StatusFunil.PERDIDO, StatusFunil.DESQUALIFICADO}
PROJETO_STATUS_ENCERRADO = {StatusProjeto.CONCLUIDO, StatusProjeto.CANCELADO}


def calcular_score(db: Session, arquiteto: Arquiteto) -> Dict[str, Any]:
    agora = datetime.now(timezone.utc)
    limite_12_meses = agora - timedelta(days=365)

    projetos = (
        db.query(Projeto)
        .filter(Projeto.arquiteto_id == arquiteto.id, Projeto.arquivado == False)
        .all()
    )
    leads = db.query(Lead).filter(Lead.arquiteto_id == arquiteto.id).all()
    concorrentes = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.arquiteto_id == arquiteto.id)
        .all()
    )

    projetos_12m = [p for p in projetos if p.criado_em and _utc(p.criado_em) >= limite_12_meses]

    datas_projetos = [_utc(p.criado_em) for p in projetos if p.criado_em]
    ultimo_projeto_em = max(datas_projetos) if datas_projetos else None
    dias_desde_ultimo_projeto = (agora - ultimo_projeto_em).days if ultimo_projeto_em else None

    datas_leads = [_utc(l.criado_em) for l in leads if l.criado_em]
    ultimo_lead_em = max(datas_leads) if datas_leads else None
    candidatos_atividade = [d for d in (ultimo_projeto_em, ultimo_lead_em) if d]
    ultima_atividade_em = max(candidatos_atividade) if candidatos_atividade else None
    dias_desde_ultima_atividade = (agora - ultima_atividade_em).days if ultima_atividade_em else None

    recencia = pontuar_recencia(dias_desde_ultimo_projeto)
    frequencia = pontuar_frequencia(len(projetos_12m))
    soma_valor = sum(p.valor_contrato for p in projetos_12m if p.valor_contrato)
    valor = pontuar_valor(soma_valor)
    rfv = calcular_rfv(recencia, frequencia, valor)

    leads_ativos = [l for l in leads if l.status_funil not in LEADS_STATUS_TERMINAL]
    projetos_ativos = [p for p in projetos if p.status not in PROJETO_STATUS_ENCERRADO]
    potencial = pontuar_potencial(len(leads_ativos) + len(projetos_ativos))

    meses_desde_cadastro = meses_entre(_utc(arquiteto.criado_em), agora)
    tempo_parceria = pontuar_tempo_parceria(meses_desde_cadastro)
    meses_com_projeto = contar_meses_distintos(p.criado_em for p in projetos_12m)
    consistencia = pontuar_consistencia(meses_com_projeto)
    leads_fechados = sum(1 for l in leads if l.status_funil == StatusFunil.FECHADO)
    leads_perdidos = sum(1 for l in leads if l.status_funil == StatusFunil.PERDIDO)
    leads_desqualificados = sum(1 for l in leads if l.status_funil == StatusFunil.DESQUALIFICADO)
    taxa_conversao = pontuar_taxa_conversao(leads_fechados, leads_perdidos, leads_desqualificados)
    lealdade = calcular_lealdade(tempo_parceria, consistencia, taxa_conversao)

    score_geral = calcular_score_geral(rfv, potencial, lealdade)

    frequencia_all_time = len(projetos)
    em_risco = frequencia_all_time > 0 and (
        dias_desde_ultima_atividade is None or dias_desde_ultima_atividade > 180
    )
    tem_historico = bool(projetos) or bool(leads)
    dias_desde_cadastro = (agora - _utc(arquiteto.criado_em)).days if arquiteto.criado_em else 0

    segmento = determinar_segmento(
        tem_historico=tem_historico,
        dias_desde_cadastro=dias_desde_cadastro,
        em_risco=em_risco,
        score_geral=score_geral,
        rfv=rfv,
        potencial=potencial,
        lealdade=lealdade,
    )
    flags = determinar_flags(
        score_geral=score_geral,
        potencial=potencial,
        valor_pontos=valor,
        em_risco=em_risco,
    )

    concorrencia = calcular_risco_concorrencia(
        [c.percentual_fechamento_estimado for c in concorrentes]
    )
    concorrencia["concorrentes"] = [
        {
            "id": c.id,
            "nome_concorrente": c.nome_concorrente,
            "percentual_fechamento_estimado": c.percentual_fechamento_estimado,
        }
        for c in concorrentes
    ]

    return {
        "rfv": rfv,
        "potencial": potencial,
        "lealdade": lealdade,
        "score_geral": score_geral,
        "segmento": segmento,
        "flags": flags,
        "detalhes": {
            "recencia": recencia,
            "frequencia": frequencia,
            "valor": valor,
            "dias_desde_ultimo_projeto": dias_desde_ultimo_projeto,
            "projetos_12_meses": len(projetos_12m),
            "soma_valor_contratos_12_meses": soma_valor,
            "leads_ativos": len(leads_ativos),
            "projetos_ativos": len(projetos_ativos),
            "tempo_parceria": tempo_parceria,
            "consistencia": consistencia,
            "taxa_conversao": taxa_conversao,
            "meses_desde_cadastro": meses_desde_cadastro,
        },
        "concorrencia": concorrencia,
    }
