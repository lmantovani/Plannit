from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_adicionar_e_listar_documento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "aso_admissional", "url": "https://exemplo.com/aso.pdf", "data_vencimento": "2025-06-01"},
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "aso_admissional"

    listagem = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/documentos").json()
    assert len(listagem) == 1
    assert listagem[0]["url"] == "https://exemplo.com/aso.pdf"


def test_documento_sem_data_vencimento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "ctps", "url": "https://exemplo.com/ctps.pdf"},
    )
    assert resp.status_code == 201
    assert resp.json()["data_vencimento"] is None


def test_remover_documento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    doc = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "ctps", "url": "https://exemplo.com/ctps.pdf"},
    ).json()

    resp = auth_client.delete(f"/api/v1/colaboradores/{criado['id']}/documentos/{doc['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/documentos").json()
    assert listagem == []
