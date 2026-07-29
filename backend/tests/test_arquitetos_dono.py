from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.notificacao import Notificacao, TipoNotificacao


def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Teste", email="vendedor.dono@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_reatribuir_dono_sucesso(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/dono",
        json={"consultor_id": vendedor.id},
    )

    assert resp.status_code == 200
    assert resp.json()["consultor_id"] == vendedor.id


def test_reatribuir_dono_cria_historico(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor1 = _criar_vendedor(db_session, "Vendedor 1", "v1@plannit.com.br")
    vendedor2 = _criar_vendedor(db_session, "Vendedor 2", "v2@plannit.com.br")

    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor1.id})
    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor2.id})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/historico-dono")
    assert resp.status_code == 200
    historico = resp.json()
    assert len(historico) == 2
    # mais recente primeiro
    assert historico[0]["consultor_novo_id"] == vendedor2.id
    assert historico[0]["consultor_anterior_id"] == vendedor1.id
    assert historico[0]["consultor_novo_nome"] == "Vendedor 2"
    assert historico[1]["consultor_anterior_id"] is None
    assert historico[1]["consultor_novo_id"] == vendedor1.id


def test_reatribuir_dono_dispara_notificacao(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor.id})

    notificacao = (
        db_session.query(Notificacao)
        .filter(Notificacao.tipo == TipoNotificacao.ESPECIFICADOR_TRANSFERIDO)
        .first()
    )
    assert notificacao is not None
    assert notificacao.destinatario_id == vendedor.id
    assert notificacao.arquiteto_id == arquiteto["id"]


def test_reatribuir_dono_consultor_invalido_400(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": 9999})
    assert resp.status_code == 400


def test_reatribuir_dono_bloqueado_403(auth_client, create_client_com_user, projetista_user, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/dono",
        json={"consultor_id": vendedor.id},
    )
    assert resp.status_code == 403


def test_reatribuir_dono_expoe_consultor_nome(auth_client, db_session):
    """consultor_nome deve refletir o dono atual da carteira após reatribuição (bug: nunca era produzido pelo backend)."""
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/dono",
        json={"consultor_id": vendedor.id},
    )
    assert resp.status_code == 200
    assert resp.json()["consultor_nome"] == vendedor.nome

    # também deve aparecer na listagem (endpoint com eager-load, evitando N+1)
    listagem = auth_client.get("/api/v1/arquitetos/").json()
    alvo = next(a for a in listagem if a["id"] == arquiteto["id"])
    assert alvo["consultor_nome"] == vendedor.nome

    # e no GET individual
    unico = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}").json()
    assert unico["consultor_nome"] == vendedor.nome
