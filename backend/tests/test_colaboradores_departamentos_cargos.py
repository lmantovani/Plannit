def test_criar_departamento(auth_client):
    resp = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Comercial"
    assert data["ativo"] is True


def test_listar_departamentos(auth_client):
    auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Produção"})

    resp = auth_client.get("/api/v1/colaboradores/departamentos")
    assert resp.status_code == 200
    nomes = [d["nome"] for d in resp.json()]
    assert nomes == ["Comercial", "Produção"]


def test_editar_departamento_inativar(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()

    resp = auth_client.put(f"/api/v1/colaboradores/departamentos/{dep['id']}", json={"ativo": False})
    assert resp.status_code == 200
    assert resp.json()["ativo"] is False
    assert resp.json()["nome"] == "Comercial"


def test_criar_cargo(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()

    resp = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep["id"]})
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Vendedor"
    assert data["departamento_id"] == dep["id"]
    assert data["departamento_nome"] == "Comercial"
    assert data["ativo"] is True


def test_listar_cargos_filtro_departamento(auth_client):
    dep1 = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()
    dep2 = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Produção"}).json()
    auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep1["id"]})
    auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Projetista", "departamento_id": dep2["id"]})

    resp = auth_client.get("/api/v1/colaboradores/cargos", params={"departamento_id": dep1["id"]})
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Vendedor"]


def test_editar_cargo(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()
    cargo = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep["id"]}).json()

    resp = auth_client.put(f"/api/v1/colaboradores/cargos/{cargo['id']}", json={"nome": "Vendedor Sênior"})
    assert resp.status_code == 200
    assert resp.json()["nome"] == "Vendedor Sênior"


def test_departamentos_bloqueado_para_perfil_sem_permissao(create_client_com_user, projetista_user):
    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.get("/api/v1/colaboradores/departamentos")
    assert resp.status_code == 403


def test_rh_tem_acesso(create_client_com_user, rh_user):
    rh_client = create_client_com_user(rh_user)
    resp = rh_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    assert resp.status_code == 201
