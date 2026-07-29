def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def test_listar_clientes_vazio(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_criar_cliente_vinculado_e_listar(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp_cliente = auth_client.post("/api/v1/clientes/", json={
        "nome": "Cliente Indicado", "telefone": "11999990000", "arquiteto_id": arquiteto["id"],
    })
    assert resp_cliente.status_code == 201
    assert resp_cliente.json()["arquiteto_id"] == arquiteto["id"]

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Cliente Indicado"]


def test_listar_clientes_nao_mistura_outro_arquiteto(auth_client):
    arquiteto1 = _criar_arquiteto(auth_client, "Arq 1")
    arquiteto2 = _criar_arquiteto(auth_client, "Arq 2")
    auth_client.post("/api/v1/clientes/", json={"nome": "Do Arq 1", "telefone": "11900000001", "arquiteto_id": arquiteto1["id"]})
    auth_client.post("/api/v1/clientes/", json={"nome": "Do Arq 2", "telefone": "11900000002", "arquiteto_id": arquiteto2["id"]})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto1['id']}/clientes")
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Do Arq 1"]


def test_listar_clientes_arquiteto_inexistente_404(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/9999/clientes")
    assert resp.status_code == 404
