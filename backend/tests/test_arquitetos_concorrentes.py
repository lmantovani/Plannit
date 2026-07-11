def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome})
    assert resp.status_code == 201
    return resp.json()


def test_criar_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Móveis Rivais", "percentual_fechamento_estimado": 40},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["nome_concorrente"] == "Móveis Rivais"
    assert data["percentual_fechamento_estimado"] == 40
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["registrado_por_id"] is not None


def test_criar_concorrente_percentual_invalido_422(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Móveis Rivais", "percentual_fechamento_estimado": 150},
    )

    assert resp.status_code == 422


def test_listar_concorrentes_ordenado_por_percentual_desc(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    )
    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja B", "percentual_fechamento_estimado": 70},
    )

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes")

    assert resp.status_code == 200
    nomes = [c["nome_concorrente"] for c in resp.json()]
    assert nomes == ["Loja B", "Loja A"]


def test_atualizar_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    concorrente = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    ).json()

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes/{concorrente['id']}",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 55},
    )

    assert resp.status_code == 200
    assert resp.json()["percentual_fechamento_estimado"] == 55


def test_remover_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    concorrente = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    ).json()

    resp = auth_client.delete(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes/{concorrente['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes").json()
    assert listagem == []
