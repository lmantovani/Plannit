def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def test_lista_clientes_vinculados_ao_arquiteto(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    cliente = auth_client.post(
        "/api/v1/clientes/",
        json={"nome": "Cliente da Ana", "telefone": "11999990000", "arquiteto_id": arquiteto["id"]},
    ).json()
    assert cliente["arquiteto_id"] == arquiteto["id"]

    auth_client.post(
        "/api/v1/clientes/", json={"nome": "Cliente Sem Vínculo", "telefone": "11999990001"}
    )

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Cliente da Ana"]


def test_lista_clientes_vazia_quando_arquiteto_sem_vinculo(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_lista_clientes_arquiteto_inexistente_404(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/9999/clientes")
    assert resp.status_code == 404
