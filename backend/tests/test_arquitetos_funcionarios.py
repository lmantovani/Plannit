from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Um", email="vendedor.funcionario@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_cria_funcionario_com_flag_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "João Sócio", "funcao": "Sócio", "decisor": True},
    )
    assert resp.status_code == 201
    assert resp.json()["decisor"] is True


def test_atualiza_e_remove_funcionario(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    funcionario = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "Estagiária", "decisor": False},
    ).json()

    resp_patch = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios/{funcionario['id']}",
        json={"decisor": True, "observacoes": "Passou a decidir compras pequenas"},
    )
    assert resp_patch.status_code == 200
    assert resp_patch.json()["decisor"] is True

    resp_delete = auth_client.delete(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios/{funcionario['id']}"
    )
    assert resp_delete.status_code == 204

    resp_lista = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios")
    assert resp_lista.json() == []


def test_vendedor_nao_vinculado_nao_pode_gerenciar_funcionarios(auth_client, db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session, nome="Vinculado", email="vinculado.func@plannit.com.br")
    outro_vendedor = _criar_vendedor(db_session, nome="Outro", email="outro.func@plannit.com.br")
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id})

    outro_client = create_client_com_user(outro_vendedor)
    resp = outro_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "Alguém"},
    )
    assert resp.status_code == 403
