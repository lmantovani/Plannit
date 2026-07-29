from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_desligar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/desligar",
        json={
            "data_desligamento": "2025-03-01",
            "tipo_desligamento": "pedido_demissao",
            "motivo_desligamento": "Mudança de cidade",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_active"] is False
    assert data["data_desligamento"] == "2025-03-01"
    assert data["tipo_desligamento"] == "pedido_demissao"
    assert data["motivo_desligamento"] == "Mudança de cidade"


def test_desligar_colaborador_ja_desligado_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    payload = {"data_desligamento": "2025-03-01", "tipo_desligamento": "pedido_demissao", "motivo_desligamento": "Motivo"}
    auth_client.post(f"/api/v1/colaboradores/{criado['id']}/desligar", json=payload)

    resp = auth_client.post(f"/api/v1/colaboradores/{criado['id']}/desligar", json=payload)
    assert resp.status_code == 400


def test_desligar_colaborador_continua_visivel_por_id(auth_client):
    """RH-RN009: colaborador desligado nunca é excluído, só inativado."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/desligar",
        json={"data_desligamento": "2025-03-01", "tipo_desligamento": "pedido_demissao", "motivo_desligamento": "Motivo"},
    )

    resp = auth_client.get(f"/api/v1/colaboradores/{criado['id']}")
    assert resp.status_code == 200
