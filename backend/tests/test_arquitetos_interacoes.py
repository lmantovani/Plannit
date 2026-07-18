from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Um", email="vendedor.interacao@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_vendedor_vinculado_registra_interacao(auth_client, db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id})

    vendedor_client = create_client_com_user(vendedor)
    resp = vendedor_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "observacao": "Combinei visita para semana que vem"},
    )
    assert resp.status_code == 201
    assert resp.json()["autor_nome"] == vendedor.nome
    assert resp.json()["tipo"] == "ligacao"


def test_vendedor_nao_vinculado_nao_pode_registrar_interacao(auth_client, db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session, nome="Vinculado", email="vinculado@plannit.com.br")
    outro_vendedor = _criar_vendedor(db_session, nome="Outro", email="outro@plannit.com.br")
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id})

    outro_client = create_client_com_user(outro_vendedor)
    resp = outro_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "observacao": "Tentando registrar sem ser o dono"},
    )
    assert resp.status_code == 403


def test_lista_interacoes_mais_recente_primeiro(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita_escritorio", "observacao": "Primeira visita"},
    )
    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "envio_brinde", "observacao": "Enviamos um brinde de fim de ano"},
    )

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes")
    assert resp.status_code == 200
    tipos = [i["tipo"] for i in resp.json()]
    assert tipos == ["envio_brinde", "visita_escritorio"]
