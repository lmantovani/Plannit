from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def _criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    return auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()


def test_criar_beneficio_grava_historico_inicial(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Vale-Refeição"
    assert data["valor"] == 600.0
    assert data["ativo"] is True

    historico = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{data['id']}/historico").json()
    assert len(historico) == 1
    assert historico[0]["valor"] == 600.0
    assert historico[0]["motivo"] == "Cadastro inicial"


def test_listar_beneficios(auth_client):
    colaborador = _criar_colaborador(auth_client)
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )

    resp = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios")
    assert resp.status_code == 200
    nomes = [b["nome"] for b in resp.json()]
    assert nomes == ["Plano de Saúde", "Vale-Refeição"]  # ordenado por nome


def test_editar_beneficio_nome_e_ativo_nao_altera_valor(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()

    resp = auth_client.put(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}",
        json={"nome": "Vale-Refeição Flex", "ativo": False, "valor": 9999.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["nome"] == "Vale-Refeição Flex"
    assert data["ativo"] is False
    assert data["valor"] == 600.0  # "valor" não existe em BeneficioUpdate — ignorado


def test_ajustar_valor_beneficio_atualiza_atual_e_grava_historico(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 350.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste anual do plano"},
    )
    assert resp.status_code == 201

    atualizado = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios").json()
    beneficio_atualizado = next(b for b in atualizado if b["id"] == beneficio["id"])
    assert beneficio_atualizado["valor"] == 350.0

    historico = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico").json()
    assert len(historico) == 2
    assert historico[0]["valor"] == 350.0  # mais recente primeiro


def test_ajuste_retroativo_nao_sobrescreve_valor_atual(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 350.0, "data_vigencia": "2025-06-01", "motivo": "Reajuste junho"},
    )

    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 320.0, "data_vigencia": "2025-01-01", "motivo": "Correção retroativa"},
    )

    atualizado = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios").json()
    beneficio_atualizado = next(b for b in atualizado if b["id"] == beneficio["id"])
    assert beneficio_atualizado["valor"] == 350.0  # continua o mais recente


def test_valor_beneficio_zero_ou_negativo_422(auth_client):
    colaborador = _criar_colaborador(auth_client)
    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    assert resp.status_code == 422
