from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_editar_colaborador_dados_basicos(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"telefone_pessoal": "11988887777"})
    assert resp.status_code == 200
    assert resp.json()["telefone_pessoal"] == "11988887777"


def test_editar_colaborador_nao_altera_salario_direto(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"salario_clt": 99999.0})
    assert resp.status_code == 200
    assert resp.json()["salario_clt"] == 3500.0  # não mudou — campo extra ignorado por ColaboradorUpdate


def test_lancar_novo_salario_atualiza_atual_e_grava_historico(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-salarial",
        json={"salario_clt": 4200.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste anual"},
    )
    assert resp.status_code == 201
    assert resp.json()["salario_clt"] == 4200.0

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["salario_clt"] == 4200.0
    assert atualizado["data_vigencia_salario"] == "2025-01-01"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-salarial").json()
    assert len(historico) == 2  # admissão + reajuste
    assert historico[0]["motivo"] == "Reajuste anual"  # mais recente primeiro
    assert historico[1]["motivo"] == "Admissão"


# === Fix #5 — lançamento retroativo não sobrescreve o valor atual ===

def test_lancamento_retroativo_nao_sobrescreve_salario_atual(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    # primeiro o reajuste mais novo
    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-salarial",
        json={"salario_clt": 5000.0, "data_vigencia": "2025-06-01", "motivo": "Reajuste junho"},
    )
    # depois uma correção retroativa, com data anterior
    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-salarial",
        json={"salario_clt": 4200.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste janeiro (lançado depois)"},
    )
    assert resp.status_code == 201

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["salario_clt"] == 5000.0  # continua o mais recente
    assert atualizado["data_vigencia_salario"] == "2025-06-01"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-salarial").json()
    assert len(historico) == 3  # admissão + junho + janeiro retroativo
    assert [h["salario_clt"] for h in historico] == [5000.0, 4200.0, 3500.0]


def test_lancar_salario_negativo_422(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-salarial",
        json={"salario_clt": -1.0, "data_vigencia": "2025-01-01", "motivo": "Erro"},
    )
    assert resp.status_code == 422
