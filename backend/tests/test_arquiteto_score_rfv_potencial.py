import pytest
from app.services.arquiteto_score import (
    pontuar_recencia,
    pontuar_frequencia,
    pontuar_valor,
    calcular_rfv,
    pontuar_potencial,
)


@pytest.mark.parametrize("dias,esperado", [
    (None, 0),
    (0, 100),
    (30, 100),
    (31, 70),
    (90, 70),
    (91, 40),
    (180, 40),
    (181, 20),
    (365, 20),
    (366, 5),
])
def test_pontuar_recencia(dias, esperado):
    assert pontuar_recencia(dias) == esperado


@pytest.mark.parametrize("qtd,esperado", [
    (0, 0),
    (1, 30),
    (2, 60),
    (3, 60),
    (4, 85),
    (6, 85),
    (7, 100),
    (10, 100),
])
def test_pontuar_frequencia(qtd, esperado):
    assert pontuar_frequencia(qtd) == esperado


@pytest.mark.parametrize("soma,esperado", [
    (0, 0),
    (None, 0),
    (49_999, 30),
    (50_000, 55),
    (149_999, 55),
    (150_000, 75),
    (349_999, 75),
    (350_000, 90),
    (699_999, 90),
    (700_000, 100),
    (1_000_000, 100),
])
def test_pontuar_valor(soma, esperado):
    assert pontuar_valor(soma) == esperado


def test_calcular_rfv_e_media_simples():
    assert calcular_rfv(recencia=100, frequencia=60, valor=30) == pytest.approx(63.3, abs=0.1)


@pytest.mark.parametrize("qtd,esperado", [
    (0, 0),
    (1, 40),
    (2, 65),
    (3, 65),
    (4, 85),
    (6, 85),
    (7, 100),
])
def test_pontuar_potencial(qtd, esperado):
    assert pontuar_potencial(qtd) == esperado
