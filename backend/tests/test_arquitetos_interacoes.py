def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def test_listar_interacoes_vazio(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_registrar_interacao(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita", "resumo": "Visita ao escritório para apresentar portfólio"},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "visita"
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["lead_id"] is None
    assert data["responsavel_id"] is not None


def test_registrar_interacao_com_lead_gerado(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    lead = auth_client.post(
        "/api/v1/leads/",
        json={"nome": "Cliente Indicado", "telefone": "11999990000", "arquiteto_id": arquiteto["id"]},
    ).json()

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "resumo": "Indicou um cliente novo", "lead_id": lead["id"]},
    )

    assert resp.status_code == 201
    assert resp.json()["lead_id"] == lead["id"]


def test_registrar_interacao_arquiteto_inexistente_404(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/9999/interacoes",
        json={"tipo": "email", "resumo": "Teste"},
    )
    assert resp.status_code == 404


def test_listar_interacoes_ordem_mais_recente_primeiro(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.post(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes", json={"tipo": "email", "resumo": "Primeira"})
    auth_client.post(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes", json={"tipo": "whatsapp", "resumo": "Segunda"})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes")
    resumos = [i["resumo"] for i in resp.json()]
    assert resumos == ["Segunda", "Primeira"]


def test_interacao_traz_responsavel_nome(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita_loja", "resumo": "Especificador veio conhecer o showroom"},
    )
    assert resp.status_code == 201
    assert resp.json()["responsavel_nome"] is not None

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes").json()
    assert listagem[0]["responsavel_nome"] == resp.json()["responsavel_nome"]
