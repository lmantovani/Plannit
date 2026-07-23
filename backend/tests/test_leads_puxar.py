from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_vendedor(db_session, nome, email):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _criar_lead_aguardando(auth_client, nome, telefone):
    resp = auth_client.post("/api/v1/leads/", json={
        "nome": nome, "telefone": telefone, "origem": "whatsapp",
    })
    return resp.json()


def test_puxar_lead_mais_antigo(db_session, auth_client, create_client_com_user):
    lead = _criar_lead_aguardando(auth_client, "Aguardando Um", "11911112222")
    vendedor = _criar_vendedor(db_session, "Vendedor Puxa", "vendedor.puxa@plannit.com.br")

    resp = create_client_com_user(vendedor).post(f"/api/v1/leads/{lead['id']}/puxar")
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] == vendedor.id


def test_puxar_lead_gera_primeira_interacao(db_session, auth_client, create_client_com_user):
    lead = _criar_lead_aguardando(auth_client, "Aguardando Dois", "11922223333")
    vendedor = _criar_vendedor(db_session, "Vendedor Interacao", "vendedor.interacao.puxa@plannit.com.br")
    client = create_client_com_user(vendedor)

    client.post(f"/api/v1/leads/{lead['id']}/puxar")
    interacoes = client.get(f"/api/v1/leads/{lead['id']}/interacoes").json()
    assert len(interacoes) == 1


def test_puxar_lead_que_nao_e_o_mais_antigo_falha(db_session, auth_client, create_client_com_user):
    mais_antigo = _criar_lead_aguardando(auth_client, "Antigo", "11933334444")
    mais_novo = _criar_lead_aguardando(auth_client, "Novo", "11944445555")
    vendedor = _criar_vendedor(db_session, "Vendedor Ordem", "vendedor.ordem.puxa@plannit.com.br")

    resp = create_client_com_user(vendedor).post(f"/api/v1/leads/{mais_novo['id']}/puxar")
    assert resp.status_code == 400
    assert str(mais_antigo["id"]) in resp.json()["detail"]


def test_puxar_lead_ja_atribuido_retorna_409(db_session, auth_client, create_client_com_user):
    lead = _criar_lead_aguardando(auth_client, "Corrida", "11955556666")
    v1 = _criar_vendedor(db_session, "V1", "v1.corrida@plannit.com.br")
    v2 = _criar_vendedor(db_session, "V2", "v2.corrida@plannit.com.br")

    create_client_com_user(v1).post(f"/api/v1/leads/{lead['id']}/puxar")
    resp = create_client_com_user(v2).post(f"/api/v1/leads/{lead['id']}/puxar")
    assert resp.status_code in (400, 409)


def test_puxar_sem_leads_aguardando_retorna_404(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session, "Vendedor Vazio", "vendedor.vazio.puxa@plannit.com.br")
    resp = create_client_com_user(vendedor).post("/api/v1/leads/999/puxar")
    assert resp.status_code == 404


def test_gestor_nao_pode_puxar_lead(auth_client):
    lead_resp = auth_client.post("/api/v1/leads/", json={
        "nome": "Aguardando Gestor", "telefone": "11966667777", "origem": "whatsapp",
    })
    resp = auth_client.post(f"/api/v1/leads/{lead_resp.json()['id']}/puxar")
    assert resp.status_code == 403
