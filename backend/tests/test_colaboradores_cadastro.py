import pytest

from app.models.colaborador import Colaborador


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


def test_criar_colaborador_com_contato_pessoal_corporativo_e_perfil_disc(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    payload = _payload_base(cargo["id"], dep["id"])
    payload["telefone_pessoal"] = "11955554444"
    payload["telefone_corporativo"] = "1130001000"
    payload["perfil_disc_primario"] = "dominante"
    payload["perfil_disc_secundario"] = "influente"
    payload["observacoes_comportamentais"] = "Comunicativo, mas impaciente em reuniões longas."

    resp = auth_client.post("/api/v1/colaboradores/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["telefone_pessoal"] == "11955554444"
    assert data["telefone_corporativo"] == "1130001000"
    assert data["perfil_disc_primario"] == "dominante"
    assert data["perfil_disc_secundario"] == "influente"
    assert data["observacoes_comportamentais"] == "Comunicativo, mas impaciente em reuniões longas."


def test_colaboradores_bloqueado_para_perfil_sem_permissao(create_client_com_user, projetista_user):
    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.get("/api/v1/colaboradores/")
    assert resp.status_code == 403


# === Fix #1 / #2 — validação de FKs no PUT ===

def test_put_gestor_de_si_mesmo_400(auth_client):
    """Auto-referência em gestor_id corrompia o registro de forma irrecuperável
    (CircularDependencyError em todo commit seguinte, sem endpoint de DELETE)."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"gestor_id": criado["id"]})
    assert resp.status_code == 400
    assert "si mesmo" in resp.json()["detail"]

    # o registro continua íntegro e gravável depois da recusa
    depois = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"telefone_pessoal": "11955554444"})
    assert depois.status_code == 200
    assert depois.json()["gestor_id"] is None
    assert depois.json()["telefone_pessoal"] == "11955554444"


def test_put_gestor_inexistente_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"gestor_id": 99999})
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Gestor inválido"


def test_put_gestor_valido_aceito(auth_client):
    """Contraprova dos dois testes acima: gestor existente e diferente do próprio id passa."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    gestor = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Gestora")
    ).json()
    criado = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Subordinado")
    ).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"gestor_id": gestor["id"]})
    assert resp.status_code == 200
    assert resp.json()["gestor_id"] == gestor["id"]
    assert resp.json()["gestor_nome"] == "Gestora"


def test_put_user_id_inexistente_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"user_id": 99999})
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Usuário inválido"


def test_put_user_id_valido_aceito(auth_client, diretoria_user):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"user_id": diretoria_user.id})
    assert resp.status_code == 200
    assert resp.json()["user_id"] == diretoria_user.id


# === Fix #3 — departamento sempre derivado do cargo ===

def test_criar_colaborador_cargo_de_outro_departamento_400(auth_client):
    dep_comercial, cargo_comercial = _criar_departamento_e_cargo(auth_client)
    dep_tecnico = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Técnico"}).json()

    resp = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo_comercial["id"], dep_tecnico["id"])
    )
    assert resp.status_code == 400
    assert "não corresponde" in resp.json()["detail"]


def test_put_nao_altera_departamento(auth_client):
    """departamento_id saiu de ColaboradorUpdate — só muda via promoção."""
    dep_comercial, cargo_comercial = _criar_departamento_e_cargo(auth_client)
    dep_tecnico = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Técnico"}).json()
    criado = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo_comercial["id"], dep_comercial["id"])
    ).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"departamento_id": dep_tecnico["id"]})
    assert resp.status_code == 200
    assert resp.json()["departamento_id"] == dep_comercial["id"]
    assert resp.json()["departamento_nome"] == "Comercial"


# === Fix #7 — validações e atomicidade ===

def test_criar_colaborador_salario_negativo_422(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    payload = _payload_base(cargo["id"], dep["id"])
    payload["salario_clt"] = -100.0

    resp = auth_client.post("/api/v1/colaboradores/", json=payload)
    assert resp.status_code == 422


def test_listar_colaboradores_regime_invalido_422(auth_client):
    """regime virou filtro tipado por enum."""
    resp = auth_client.get("/api/v1/colaboradores/", params={"regime": "estagio"})
    assert resp.status_code == 422

    resp_ok = auth_client.get("/api/v1/colaboradores/", params={"regime": "clt"})
    assert resp_ok.status_code == 200


def test_criar_colaborador_e_atomico(auth_client, db_session, monkeypatch):
    """Falha depois do INSERT do colaborador não pode deixar colaborador sem
    histórico de admissão — tudo vai num único commit (flush + 1 commit)."""
    import app.api.v1.endpoints.colaboradores as endpoint_mod

    dep, cargo = _criar_departamento_e_cargo(auth_client)

    class _Boom(Exception):
        pass

    def _explodir(*args, **kwargs):
        raise _Boom("falha ao gravar histórico de cargo")

    monkeypatch.setattr(endpoint_mod, "HistoricoCargoColaborador", _explodir)

    with pytest.raises(_Boom):
        auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"]))

    # nada foi commitado: o rollback (que o get_db real faz no close) descarta o flush
    db_session.rollback()
    assert db_session.query(Colaborador).count() == 0
