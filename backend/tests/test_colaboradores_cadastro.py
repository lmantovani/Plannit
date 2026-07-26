def _criar_departamento_e_cargo(auth_client, dep_nome="Comercial", cargo_nome="Vendedor"):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": dep_nome}).json()
    cargo = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": cargo_nome, "departamento_id": dep["id"]}).json()
    return dep, cargo


def _payload_base(cargo_id, departamento_id, cpf="52998224725", nome="Ana Colaboradora"):
    return {
        "nome": nome,
        "cpf": cpf,
        "data_admissao": "2024-01-10",
        "cargo_id": cargo_id,
        "departamento_id": departamento_id,
        "regime": "clt",
        "salario_clt": 3500.0,
        "data_vigencia_salario": "2024-01-10",
    }


def test_criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)

    resp = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"]))
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Ana Colaboradora"
    assert data["cpf"] == "52998224725"
    assert data["cargo_nome"] == "Vendedor"
    assert data["departamento_nome"] == "Comercial"
    assert data["is_active"] is True
    assert data["salario_clt"] == 3500.0


def test_criar_colaborador_cpf_invalido_422(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)

    resp = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="11111111111"))
    assert resp.status_code == 422


def test_criar_colaborador_cpf_duplicado_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"]))

    resp = auth_client.post(
        "/api/v1/colaboradores/",
        json=_payload_base(cargo["id"], dep["id"], nome="Outro Nome"),
    )
    assert resp.status_code == 400


def test_listar_colaboradores_filtros(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Ana"))
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Bruno"))

    resp = auth_client.get("/api/v1/colaboradores/", params={"busca": "ana"})
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Ana"]

    resp = auth_client.get("/api/v1/colaboradores/", params={"departamento_id": dep["id"]})
    assert len(resp.json()) == 2


def test_organograma_gestor_e_subordinados(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    gestor = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Gestora")
    ).json()

    payload_subordinado = _payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Subordinado")
    payload_subordinado["gestor_id"] = gestor["id"]
    subordinado = auth_client.post("/api/v1/colaboradores/", json=payload_subordinado).json()

    resp_gestor = auth_client.get(f"/api/v1/colaboradores/{gestor['id']}")
    assert resp_gestor.json()["gestor_nome"] is None
    assert [s["nome"] for s in resp_gestor.json()["subordinados_diretos"]] == ["Subordinado"]

    resp_subordinado = auth_client.get(f"/api/v1/colaboradores/{subordinado['id']}")
    assert resp_subordinado.json()["gestor_nome"] == "Gestora"
    assert resp_subordinado.json()["subordinados_diretos"] == []


def test_colaboradores_bloqueado_para_perfil_sem_permissao(create_client_com_user, projetista_user):
    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.get("/api/v1/colaboradores/")
    assert resp.status_code == 403
