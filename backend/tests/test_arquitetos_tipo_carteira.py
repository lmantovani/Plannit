def test_criar_arquiteto_sem_tipo_falha_422(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Sem Tipo"})
    assert resp.status_code == 422


def test_criar_arquiteto_com_tipo(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/",
        json={"nome": "Ana Designer", "tipo": "designer_interiores", "especialidade": "interiores comerciais"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "designer_interiores"
    assert data["especialidade"] == "interiores comerciais"
    assert data["status_carteira"] == "em_prospeccao"
    assert data["consultor_id"] is None


def test_filtro_por_tipo(auth_client):
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Arq 1", "tipo": "arquiteto"})
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Dec 1", "tipo": "decorador"})

    resp = auth_client.get("/api/v1/arquitetos/", params={"tipo": "decorador"})
    assert resp.status_code == 200
    nomes = [a["nome"] for a in resp.json()]
    assert nomes == ["Dec 1"]


def test_filtro_por_status_carteira(auth_client):
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Prospeccao", "tipo": "arquiteto"}
    ).json()
    auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"status_carteira": "ativo"})
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Ainda Prospeccao", "tipo": "arquiteto"})

    resp = auth_client.get("/api/v1/arquitetos/", params={"status_carteira": "ativo"})
    assert resp.status_code == 200
    nomes = [a["nome"] for a in resp.json()]
    assert nomes == ["Prospeccao"]


def test_patch_generico_nao_altera_consultor_id(auth_client):
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Teste", "tipo": "arquiteto"}
    ).json()

    resp = auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"consultor_id": 999})
    assert resp.status_code == 200
    assert resp.json()["consultor_id"] is None


def test_patch_sem_tipo_nao_falha(auth_client):
    """Regressão: antes desta task, PATCH usava ArquitetoCreate e exigia tipo mesmo em update parcial."""
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Teste", "tipo": "arquiteto"}
    ).json()

    resp = auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"escritorio": "Novo Escritório"})
    assert resp.status_code == 200
    assert resp.json()["escritorio"] == "Novo Escritório"
    assert resp.json()["tipo"] == "arquiteto"


def test_criar_arquiteto_tipo_corretor(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Corretor Ana", "tipo": "corretor"})
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "corretor"


def test_criar_arquiteto_tipo_outro(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Caso Especial", "tipo": "outro"})
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "outro"
