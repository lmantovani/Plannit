from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def _criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    return auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()


def test_criar_lancamento_bonus(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-15", "descricao": "Fechamento do mês"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "bonus"
    assert data["valor"] == 500.0
    assert data["competencia"] == "2025-06-01"  # normalizado para o dia 1


def test_criar_lancamento_comissao(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "comissao", "valor": 1200.0, "competencia": "2025-06-01", "descricao": "Meta 105% atingida"},
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "comissao"


def test_listar_lancamentos_filtra_por_tipo(auth_client):
    colaborador = _criar_colaborador(auth_client)
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-01"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "comissao", "valor": 1200.0, "competencia": "2025-06-01"},
    )

    resp_todos = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis")
    assert len(resp_todos.json()) == 2

    resp_bonus = auth_client.get(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis", params={"tipo": "bonus"}
    )
    assert len(resp_bonus.json()) == 1
    assert resp_bonus.json()[0]["tipo"] == "bonus"


def test_lancamento_variavel_valor_negativo_422(auth_client):
    colaborador = _criar_colaborador(auth_client)
    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": -10.0, "competencia": "2025-06-01"},
    )
    assert resp.status_code == 422


def test_excluir_lancamento_variavel_diretoria_sucesso(auth_client):
    colaborador = _criar_colaborador(auth_client)
    criado = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-01", "descricao": "Erro de digitação"},
    ).json()

    resp = auth_client.delete(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis/{criado['id']}"
    )
    assert resp.status_code == 204

    resp_lista = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis")
    assert resp_lista.json() == []


def test_excluir_lancamento_variavel_bloqueado_para_rh_403(create_client_com_user, rh_user, auth_client):
    colaborador = _criar_colaborador(auth_client)
    criado = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-01"},
    ).json()

    rh_client = create_client_com_user(rh_user)
    resp = rh_client.delete(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis/{criado['id']}"
    )
    assert resp.status_code == 403

    # continua íntegro — só a Diretoria pode excluir
    resp_lista = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis")
    assert len(resp_lista.json()) == 1
