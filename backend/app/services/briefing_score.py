"""
Serviço de cálculo de Score do Briefing — RF009, RN002
O score bloqueia envio para fila se < score_minimo (padrão: 70)
"""
from typing import Dict, Any


CRITERIOS_SCORE = {
    # Dados obrigatórios (peso total: 40 pontos)
    "cidade_obra": {"peso": 8, "descricao": "Cidade da obra informada"},
    "ambientes": {"peso": 10, "descricao": "Ambientes selecionados"},
    "prazo_desejado": {"peso": 8, "descricao": "Prazo desejado informado"},
    "faixa_investimento": {"peso": 14, "descricao": "Faixa de investimento definida"},

    # Qualidade do levantamento (peso total: 35 pontos)
    "ambientes_detalhados": {"peso": 15, "descricao": "Ambientes com descrição detalhada"},
    "referencias_visuais": {"peso": 12, "descricao": "Referências visuais enviadas"},
    "medidas_preliminares": {"peso": 8, "descricao": "Medidas preliminares informadas"},

    # Informações comerciais (peso total: 25 pontos)
    "estilo_preferido": {"peso": 8, "descricao": "Estilo preferido informado"},
    "arquiteto_vinculado": {"peso": 7, "descricao": "Arquiteto/especificador vinculado"},
    "observacoes": {"peso": 10, "descricao": "Observações e contexto do cliente"},
}


def calcular_score_briefing(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcula o score do briefing (0-100) com breakdown por critério.
    Retorna: {score, detalhes, aprovado, pontos_faltantes}
    """
    detalhes = {}
    pontos_obtidos = 0
    pontos_faltantes = []

    # Dados obrigatórios
    detalhes["cidade_obra"] = bool(dados.get("cidade_obra"))
    if detalhes["cidade_obra"]:
        pontos_obtidos += CRITERIOS_SCORE["cidade_obra"]["peso"]
    else:
        pontos_faltantes.append("Cidade da obra")

    ambientes = dados.get("ambientes") or []
    detalhes["ambientes"] = len(ambientes) > 0
    if detalhes["ambientes"]:
        pontos_obtidos += CRITERIOS_SCORE["ambientes"]["peso"]
    else:
        pontos_faltantes.append("Ambientes do projeto")

    detalhes["prazo_desejado"] = bool(dados.get("prazo_desejado"))
    if detalhes["prazo_desejado"]:
        pontos_obtidos += CRITERIOS_SCORE["prazo_desejado"]["peso"]
    else:
        pontos_faltantes.append("Prazo desejado")

    tem_faixa = bool(dados.get("faixa_investimento_min")) and bool(dados.get("faixa_investimento_max"))
    detalhes["faixa_investimento"] = tem_faixa
    if tem_faixa:
        pontos_obtidos += CRITERIOS_SCORE["faixa_investimento"]["peso"]
    else:
        pontos_faltantes.append("Faixa de investimento (mín. e máx.)")

    # Qualidade do levantamento
    ambientes_det = dados.get("ambientes_detalhados") or []
    detalhes["ambientes_detalhados"] = len(ambientes_det) > 0
    if detalhes["ambientes_detalhados"]:
        pontos_obtidos += CRITERIOS_SCORE["ambientes_detalhados"]["peso"]
    else:
        pontos_faltantes.append("Detalhamento dos ambientes")

    referencias = dados.get("referencias_url") or []
    detalhes["referencias_visuais"] = len(referencias) > 0
    if detalhes["referencias_visuais"]:
        pontos_obtidos += CRITERIOS_SCORE["referencias_visuais"]["peso"]
    else:
        pontos_faltantes.append("Referências visuais")

    tem_medidas = any(
        a.get("medidas_preliminares")
        for a in (dados.get("ambientes_detalhados") or [])
        if isinstance(a, dict)
    )
    detalhes["medidas_preliminares"] = tem_medidas
    if tem_medidas:
        pontos_obtidos += CRITERIOS_SCORE["medidas_preliminares"]["peso"]

    # Informações comerciais
    detalhes["estilo_preferido"] = bool(dados.get("estilo_preferido"))
    if detalhes["estilo_preferido"]:
        pontos_obtidos += CRITERIOS_SCORE["estilo_preferido"]["peso"]

    tem_arquiteto = bool(dados.get("arquiteto_nome")) or bool(dados.get("arquiteto_id"))
    detalhes["arquiteto_vinculado"] = tem_arquiteto
    if tem_arquiteto:
        pontos_obtidos += CRITERIOS_SCORE["arquiteto_vinculado"]["peso"]

    obs = dados.get("observacoes") or ""
    detalhes["observacoes"] = len(obs) >= 50  # mínimo 50 caracteres
    if detalhes["observacoes"]:
        pontos_obtidos += CRITERIOS_SCORE["observacoes"]["peso"]

    score_minimo = dados.get("score_minimo", 70.0)

    return {
        "score": round(pontos_obtidos, 1),
        "score_minimo": score_minimo,
        "aprovado": pontos_obtidos >= score_minimo,
        "detalhes": detalhes,
        "pontos_faltantes": pontos_faltantes,
    }
