"""
Serviço de Score de Arquitetos — RFV x Potencial x Lealdade.
Critérios de pontuação são faixas fixas (mesmo padrão de app/services/briefing_score.py),
não percentil relativo entre arquitetos. Limiares numéricos ficam como constantes
nomeadas abaixo, ajustáveis sem reescrever a lógica.
"""
from typing import Optional


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
