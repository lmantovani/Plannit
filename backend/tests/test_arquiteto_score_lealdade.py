from datetime import datetime
import pytest
from app.services.arquiteto_score import (
    pontuar_tempo_parceria,
    pontuar_consistencia,
    pontuar_taxa_conversao,
    calcular_lealdade,
    calcular_score_geral,
    meses_entre,
    contar_meses_distintos,
)


@pytest.mark.parametrize("meses,esperado", [
    (0, 20),
    (2, 20),
    (3, 50),
    (11, 50),
    (12, 75),
    (23, 75),
    (24, 100),
    (48, 100),
])
def test_pontuar_tempo_parceria(meses, esperado):
    assert pontuar_tempo_parceria(meses) == esperado


@pytest.mark.parametrize("meses_com_projeto,esperado", [
    (0, 0.0),
    (6, 50.0),
    (12, 100.0),
    (15, 100.0),  # capado em 12
])
def test_pontuar_consistencia(meses_com_projeto, esperado):
    assert pontuar_consistencia(meses_com_projeto) == esperado


@pytest.mark.parametrize("fechados,perdidos,desq,esperado", [
    (0, 0, 0, 50.0),   # sem dado — neutro
    (5, 5, 0, 50.0),
    (8, 2, 0, 80.0),
    (0, 5, 5, 0.0),
])
def test_pontuar_taxa_conversao(fechados, perdidos, desq, esperado):
    assert pontuar_taxa_conversao(fechados, perdidos, desq) == esperado


def test_calcular_lealdade_e_media_simples():
    assert calcular_lealdade(tempo_parceria=100, consistencia=50, taxa_conversao=0) == pytest.approx(50.0)


def test_calcular_score_geral_e_media_simples():
    assert calcular_score_geral(rfv=90, potencial=60, lealdade=30) == pytest.approx(60.0)


def test_meses_entre():
    assert meses_entre(datetime(2025, 1, 15), datetime(2026, 3, 1)) == 13


def test_meses_entre_sem_inicio_retorna_zero():
    assert meses_entre(None, datetime(2026, 3, 1)) == 0


def test_contar_meses_distintos():
    datas = [
        datetime(2026, 1, 5),
        datetime(2026, 1, 20),
        datetime(2026, 3, 1),
    ]
    assert contar_meses_distintos(datas) == 2


def test_contar_meses_distintos_ignora_none():
    assert contar_meses_distintos([datetime(2026, 1, 5), None]) == 1
