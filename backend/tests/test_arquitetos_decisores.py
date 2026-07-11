def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome})
    assert resp.status_code == 201
    return resp.json()


def test_listar_arquitetos_vazio(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_criar_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio", "cargo": "Sócio", "is_principal": True},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "João Sócio"
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["is_principal"] is True


def test_criar_decisor_arquiteto_inexistente_404(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/9999/decisores",
        json={"nome": "Fulano"},
    )
    assert resp.status_code == 404


def test_apenas_um_decisor_principal_por_arquiteto(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    primeiro = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "Primeiro", "is_principal": True},
    ).json()

    segundo = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "Segundo", "is_principal": True},
    ).json()

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/decisores").json()
    principais = [d for d in listagem if d["is_principal"]]

    assert len(principais) == 1
    assert principais[0]["id"] == segundo["id"]
    assert primeiro["id"] != segundo["id"]


def test_atualizar_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    decisor = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio"},
    ).json()

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores/{decisor['id']}",
        json={"nome": "João Sócio", "cargo": "Sócio-diretor"},
    )

    assert resp.status_code == 200
    assert resp.json()["cargo"] == "Sócio-diretor"


def test_remover_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    decisor = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio"},
    ).json()

    resp = auth_client.delete(f"/api/v1/arquitetos/{arquiteto['id']}/decisores/{decisor['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/decisores").json()
    assert listagem == []
