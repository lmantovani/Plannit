from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_arquiteto(auth_client, nome="Ana Arquiteta", tipo="arquiteto"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": tipo})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Um", email="vendedor.teste@plannit.com.br"):
    user = User(
        nome=nome,
        email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_criar_arquiteto_exige_tipo(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Ana Arquiteta"})
    assert resp.status_code == 422


def test_criar_arquiteto_com_tipo(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"}
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "arquiteto"
    assert resp.json()["vendedor_id"] is None


def test_lista_filtra_por_tipo_e_vendedor(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)
    zeca = _criar_arquiteto(auth_client, nome="Zeca Designer", tipo="designer")
    _criar_arquiteto(auth_client, nome="Ana Arquiteta", tipo="arquiteto")

    auth_client.patch(f"/api/v1/arquitetos/{zeca['id']}", json={"vendedor_id": vendedor.id})

    resp_tipo = auth_client.get("/api/v1/arquitetos/?tipo=designer")
    assert [a["nome"] for a in resp_tipo.json()] == ["Zeca Designer"]

    resp_vendedor = auth_client.get(f"/api/v1/arquitetos/?vendedor_id={vendedor.id}")
    assert [a["nome"] for a in resp_vendedor.json()] == ["Zeca Designer"]


def test_diretoria_define_vendedor_vinculado(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)
    criado = _criar_arquiteto(auth_client)

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{criado['id']}", json={"vendedor_id": vendedor.id}
    )
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] == vendedor.id
    assert resp.json()["vendedor_nome"] == vendedor.nome


def test_recepcao_nao_pode_definir_vendedor_vinculado(db_session, create_client_com_user):
    from app.models.user import User as UserModel

    recepcao = UserModel(
        nome="Recepção Teste", email="recepcao.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RECEPCAO, is_active=True,
    )
    db_session.add(recepcao)
    db_session.commit()
    db_session.refresh(recepcao)

    vendedor = _criar_vendedor(db_session)
    recepcao_client = create_client_com_user(recepcao)

    criado = _criar_arquiteto(recepcao_client)

    resp = recepcao_client.patch(
        f"/api/v1/arquitetos/{criado['id']}", json={"vendedor_id": vendedor.id}
    )
    assert resp.status_code == 403


def test_recepcao_ainda_pode_editar_outros_campos(db_session, create_client_com_user):
    from app.models.user import User as UserModel

    recepcao = UserModel(
        nome="Recepção Teste", email="recepcao2.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RECEPCAO, is_active=True,
    )
    db_session.add(recepcao)
    db_session.commit()
    db_session.refresh(recepcao)

    recepcao_client = create_client_com_user(recepcao)
    criado = _criar_arquiteto(recepcao_client)

    resp = recepcao_client.patch(
        f"/api/v1/arquitetos/{criado['id']}", json={"endereco_escritorio": "Rua das Flores, 100"}
    )
    assert resp.status_code == 200
    assert resp.json()["endereco_escritorio"] == "Rua das Flores, 100"
