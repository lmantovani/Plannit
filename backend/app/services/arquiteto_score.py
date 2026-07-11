"""
Serviço de Score de Arquitetos — RFV x Potencial x Lealdade.
Critérios de pontuação são faixas fixas (mesmo padrão de app/services/briefing_score.py),
não percentil relativo entre arquitetos. Limiares numéricos ficam como constantes
nomeadas abaixo, ajustáveis sem reescrever a lógica.
"""
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional


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
