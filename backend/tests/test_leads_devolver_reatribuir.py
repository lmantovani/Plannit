from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_user(db_session, nome, email, perfil):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=perfil, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _criar_vendedor(db_session, nome, email):
    return _criar_user(db_session, nome, email, PerfilUsuario.VENDEDOR)


def _criar_lead_puxado(gestor_client, db_session, create_client_com_user, nome, telefone, email_vendedor):
    lead = gestor_client.post("/api/v1/leads/", json={
        "nome": nome, "telefone": telefone, "origem": "whatsapp",
    }).json()
    vendedor = _criar_vendedor(db_session, "Vendedor Devolve", email_vendedor)
    client = create_client_com_user(vendedor)
    client.post(f"/api/v1/leads/{lead['id']}/puxar")
    return lead["id"], vendedor, client


def test_vendedor_devolve_lead_com_motivo(db_session, create_client_com_user):
    gestor = _criar_user(db_session, "Gestor", "gestor@plannit.com.br", PerfilUsuario.DIRETORIA)
    gestor_client = create_client_com_user(gestor)

    lead_id, vendedor, client = _criar_lead_puxado(
        gestor_client, db_session, create_client_com_user, "Devolvido", "11911114444", "dev1@plannit.com.br"
    )

    resp = client.post(f"/api/v1/leads/{lead_id}/devolver", json={"motivo": "Cliente não atendeu"})
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] is None

    interacoes = client.get(f"/api/v1/leads/{lead_id}/interacoes").json()
    assert any("Devolvido à fila" in i["resumo"] for i in interacoes)


def test_outro_vendedor_nao_pode_devolver(db_session, create_client_com_user):
    gestor = _criar_user(db_session, "Gestor", "gestor2@plannit.com.br", PerfilUsuario.DIRETORIA)
    gestor_client = create_client_com_user(gestor)

    lead_id, _vendedor, _client = _criar_lead_puxado(
        gestor_client, db_session, create_client_com_user, "Protegido", "11922225555", "dev2@plannit.com.br"
    )
    outro = _criar_vendedor(db_session, "Outro", "outro.devolve@plannit.com.br")

    resp = create_client_com_user(outro).post(f"/api/v1/leads/{lead_id}/devolver", json={"motivo": "Tentando"})
    assert resp.status_code == 403


def test_gestor_pode_devolver_lead_de_outro_vendedor(db_session, create_client_com_user):
    gestor = _criar_user(db_session, "Gestor", "gestor3@plannit.com.br", PerfilUsuario.DIRETORIA)
    gestor_client = create_client_com_user(gestor)

    lead_id, _vendedor, _client = _criar_lead_puxado(
        gestor_client, db_session, create_client_com_user, "GestorDevolve", "11933336666", "dev3@plannit.com.br"
    )

    resp = gestor_client.post(f"/api/v1/leads/{lead_id}/devolver", json={"motivo": "Reatribuindo carteira"})
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] is None


def test_gestor_reatribui_lead_direto(db_session, create_client_com_user):
    gestor = _criar_user(db_session, "Gestor", "gestor4@plannit.com.br", PerfilUsuario.DIRETORIA)
    gestor_client = create_client_com_user(gestor)

    lead_id, _vendedor, _client = _criar_lead_puxado(
        gestor_client, db_session, create_client_com_user, "Reatribuir", "11944447777", "dev4@plannit.com.br"
    )
    novo = _criar_vendedor(db_session, "Novo Dono", "novo.dono@plannit.com.br")

    resp = gestor_client.post(f"/api/v1/leads/{lead_id}/reatribuir", json={"vendedor_id": novo.id})
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] == novo.id


def test_vendedor_nao_pode_reatribuir(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session, "Sem Permissao", "sempermissao@plannit.com.br")
    resp = create_client_com_user(vendedor).post("/api/v1/leads/1/reatribuir", json={"vendedor_id": vendedor.id})
    assert resp.status_code == 403
