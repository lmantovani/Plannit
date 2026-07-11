import pytest
from app.services.arquiteto_score import (
    determinar_segmento,
    determinar_flags,
    calcular_risco_concorrencia,
)


def _base_segmento(**overrides):
    base = dict(
        tem_historico=True,
        dias_desde_cadastro=400,
        em_risco=False,
        score_geral=50,
        rfv=50,
        potencial=50,
        lealdade=50,
    )
    base.update(overrides)
    return base


def test_segmento_inativo_sem_historico():
    assert determinar_segmento(**_base_segmento(tem_historico=False)) == "inativo"


def test_segmento_novo_promissor():
    assert determinar_segmento(**_base_segmento(dias_desde_cadastro=10)) == "novo_promissor"


def test_segmento_em_risco():
    assert determinar_segmento(**_base_segmento(em_risco=True)) == "em_risco"


def test_segmento_campeao():
    assert determinar_segmento(**_base_segmento(score_geral=90)) == "campeao"


def test_segmento_parceiro_fiel():
    assert determinar_segmento(**_base_segmento(lealdade=80, rfv=60, score_geral=60)) == "parceiro_fiel"


def test_segmento_em_ascensao():
    assert determinar_segmento(**_base_segmento(potencial=75, lealdade=30, rfv=30, score_geral=45)) == "em_ascensao"


def test_segmento_ocasional_fallback():
    assert determinar_segmento(**_base_segmento(
        score_geral=40, rfv=40, potencial=40, lealdade=40,
    )) == "ocasional"


def test_novo_promissor_tem_precedencia_sobre_campeao():
    """Um arquiteto recém-cadastrado com score alto ainda é 'novo_promissor', não 'campeao'."""
    assert determinar_segmento(**_base_segmento(dias_desde_cadastro=5, score_geral=95)) == "novo_promissor"


def test_flags_top_indicador():
    flags = determinar_flags(score_geral=90, potencial=10, valor_pontos=10, em_risco=False)
    assert "top_indicador" in flags


def test_flags_em_risco_de_perda():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=10, em_risco=True)
    assert "em_risco_de_perda" in flags


def test_flags_alto_potencial():
    flags = determinar_flags(score_geral=10, potencial=80, valor_pontos=10, em_risco=False)
    assert "alto_potencial" in flags


def test_flags_indicacao_alto_valor():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=95, em_risco=False)
    assert "indicacao_alto_valor" in flags


def test_flags_pode_ter_zero():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=10, em_risco=False)
    assert flags == []


def test_flags_pode_ter_varias_simultaneas():
    flags = determinar_flags(score_geral=90, potencial=80, valor_pontos=95, em_risco=False)
    assert set(flags) == {"top_indicador", "alto_potencial", "indicacao_alto_valor"}


@pytest.mark.parametrize("percentuais,nivel_esperado", [
    ([], "baixo"),
    ([10, 20], "baixo"),
    ([29], "baixo"),
    ([30], "medio"),
    ([60], "medio"),
    ([61], "alto"),
    ([10, 80], "alto"),
])
def test_calcular_risco_concorrencia_nivel(percentuais, nivel_esperado):
    resultado = calcular_risco_concorrencia(percentuais)
    assert resultado["nivel"] == nivel_esperado


def test_calcular_risco_concorrencia_usa_maior_percentual():
    resultado = calcular_risco_concorrencia([10, 45, 30])
    assert resultado["risco"] == 45
