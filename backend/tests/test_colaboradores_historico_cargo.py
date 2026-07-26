from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_promover_colaborador_atualiza_cargo_e_grava_historico(auth_client):
    dep, cargo_junior = _criar_departamento_e_cargo(auth_client, cargo_nome="Vendedor Júnior")
    cargo_pleno = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Pleno", "departamento_id": dep["id"]}
    ).json()
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo_junior["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_pleno["id"], "data": "2025-02-01", "justificativa": "Promoção por desempenho"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["cargo_anterior_id"] == cargo_junior["id"]
    assert data["cargo_anterior_nome"] == "Vendedor Júnior"
    assert data["cargo_novo_id"] == cargo_pleno["id"]
    assert data["cargo_novo_nome"] == "Vendedor Pleno"

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["cargo_id"] == cargo_pleno["id"]
    assert atualizado["cargo_nome"] == "Vendedor Pleno"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-cargo").json()
    assert len(historico) == 2  # admissão + promoção
    assert historico[0]["justificativa"] == "Promoção por desempenho"
    assert historico[1]["justificativa"] == "Admissão"


def test_promover_colaborador_cargo_invalido_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": 9999, "data": "2025-02-01"},
    )
    assert resp.status_code == 400


def test_criar_colaborador_grava_primeiro_historico_salarial_e_cargo(auth_client):
    """Fecha a verificação deixada pendente na Task 2: só dá pra checar os dois
    GET de histórico juntos depois que historico-cargo existe (esta task)."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    historico_salarial = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-salarial").json()
    assert len(historico_salarial) == 1
    assert historico_salarial[0]["salario_clt"] == 3500.0
    assert historico_salarial[0]["motivo"] == "Admissão"

    historico_cargo = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-cargo").json()
    assert len(historico_cargo) == 1
    assert historico_cargo[0]["cargo_anterior_id"] is None
    assert historico_cargo[0]["cargo_novo_id"] == cargo["id"]
