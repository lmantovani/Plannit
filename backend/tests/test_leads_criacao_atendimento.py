from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_vendedor(db_session, nome="Vendedor", email="vendedor.criacao@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_lead_criado_registra_criado_por(auth_client, diretoria_user):
    resp = auth_client.post("/api/v1/leads/", json={
        "nome": "Cliente Teste", "telefone": "11977776666", "origem": "whatsapp",
    })
    assert resp.status_code == 201


def test_vendedor_so_pode_atribuir_a_si_mesmo(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.autoatrib@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.autoatrib@plannit.com.br")

    resp = create_client_com_user(v1).post("/api/v1/leads/", json={
        "nome": "Cliente X", "telefone": "11955554444", "origem": "showroom",
        "vendedor_id": v2.id,
    })
    assert resp.status_code == 403


def test_lead_criado_com_vendedor_gera_primeira_interacao(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    client = create_client_com_user(vendedor)

    resp = client.post("/api/v1/leads/", json={
        "nome": "Cliente Y", "telefone": "11933332222", "origem": "instagram",
    })
    lead_id = resp.json()["id"]

    interacoes = client.get(f"/api/v1/leads/{lead_id}/interacoes").json()
    assert len(interacoes) == 1
    assert "Instagram" in interacoes[0]["resumo"]


def test_lead_aguardando_sem_vendedor_nao_gera_interacao(db_session, create_client_com_user):
    recepcao = User(
        nome="Recepção", email="recepcao.criacao@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RECEPCAO, is_active=True,
    )
    db_session.add(recepcao)
    db_session.commit()
    db_session.refresh(recepcao)
    client = create_client_com_user(recepcao)

    resp = client.post("/api/v1/leads/", json={
        "nome": "Cliente Z", "telefone": "11911110000", "origem": "whatsapp",
    })
    lead_id = resp.json()["id"]

    interacoes = client.get(f"/api/v1/leads/{lead_id}/interacoes").json()
    assert interacoes == []


def test_lead_presencial_move_vendedor_pro_final_da_fila(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.presencial@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.presencial@plannit.com.br")
    c1 = create_client_com_user(v1)
    c2 = create_client_com_user(v2)
    c1.post("/api/v1/fila-atendimento/checkin")  # posição 1
    c2.post("/api/v1/fila-atendimento/checkin")  # posição 2

    c1.post("/api/v1/leads/", json={
        "nome": "Cliente Presencial", "telefone": "11900001111", "origem": "showroom",
    })

    fila = c1.get("/api/v1/fila-atendimento/vendedores").json()
    posicoes = {item["vendedor_id"]: item["posicao"] for item in fila}
    assert posicoes[v1.id] == 3
    assert posicoes[v2.id] == 2
