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


# === Fix #3 — promoção deriva o departamento do cargo novo ===

def test_promocao_para_cargo_de_outro_departamento_atualiza_departamento(auth_client):
    dep_comercial, cargo_vendedor = _criar_departamento_e_cargo(auth_client)
    dep_tecnico = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Técnico"}).json()
    cargo_projetista = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Projetista", "departamento_id": dep_tecnico["id"]}
    ).json()
    criado = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo_vendedor["id"], dep_comercial["id"])
    ).json()
    assert criado["departamento_id"] == dep_comercial["id"]

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_projetista["id"], "data": "2025-03-01", "justificativa": "Mudança de área"},
    )
    assert resp.status_code == 201

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["cargo_id"] == cargo_projetista["id"]
    assert atualizado["departamento_id"] == dep_tecnico["id"]
    assert atualizado["departamento_nome"] == "Técnico"


# === Fix #5 — promoção retroativa não sobrescreve o cargo atual ===

def test_promocao_retroativa_nao_sobrescreve_cargo_atual(auth_client):
    dep, cargo_junior = _criar_departamento_e_cargo(auth_client, cargo_nome="Vendedor Júnior")
    cargo_pleno = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Pleno", "departamento_id": dep["id"]}
    ).json()
    cargo_senior = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Sênior", "departamento_id": dep["id"]}
    ).json()
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo_junior["id"], dep["id"])).json()

    # promoção mais nova primeiro
    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_senior["id"], "data": "2025-06-01", "justificativa": "Promoção junho"},
    )
    # depois um lançamento retroativo, com data anterior
    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_pleno["id"], "data": "2025-02-01", "justificativa": "Promoção fevereiro (atrasada)"},
    )
    assert resp.status_code == 201

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["cargo_id"] == cargo_senior["id"]  # continua o mais recente
    assert atualizado["cargo_nome"] == "Vendedor Sênior"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-cargo").json()
    assert len(historico) == 3  # admissão + junho + fevereiro retroativo
    assert [h["cargo_novo_nome"] for h in historico] == [
        "Vendedor Sênior",
        "Vendedor Pleno",
        "Vendedor Júnior",
    ]


def test_promocao_retroativa_nao_sobrescreve_departamento_atual(auth_client):
    dep_comercial, cargo_vendedor = _criar_departamento_e_cargo(auth_client)
    dep_tecnico = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Técnico"}).json()
    cargo_projetista = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Projetista", "departamento_id": dep_tecnico["id"]}
    ).json()
    cargo_vendedor_pleno = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Pleno", "departamento_id": dep_comercial["id"]}
    ).json()
    criado = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo_vendedor["id"], dep_comercial["id"])
    ).json()

    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_projetista["id"], "data": "2025-06-01"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_vendedor_pleno["id"], "data": "2025-02-01"},
    )

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["cargo_id"] == cargo_projetista["id"]
    assert atualizado["departamento_id"] == dep_tecnico["id"]
