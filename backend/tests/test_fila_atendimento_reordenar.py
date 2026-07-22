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


def test_recepcao_reordena_fila(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.reord@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.reord@plannit.com.br")
    recepcao = User(
        nome="Recepção", email="recepcao.reord@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RECEPCAO, is_active=True,
    )
    db_session.add(recepcao)
    db_session.commit()
    db_session.refresh(recepcao)

    create_client_com_user(v1).post("/api/v1/fila-atendimento/checkin")
    create_client_com_user(v2).post("/api/v1/fila-atendimento/checkin")

    resp = create_client_com_user(recepcao).patch(
        "/api/v1/fila-atendimento/reordenar", json={"ordem": [v2.id, v1.id]}
    )
    assert resp.status_code == 200
    posicoes = {item["vendedor_id"]: item["posicao"] for item in resp.json()}
    assert posicoes[v2.id] == 1
    assert posicoes[v1.id] == 2


def test_reordenar_com_lista_incompleta_falha(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.incompleta@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.incompleta@plannit.com.br")
    create_client_com_user(v1).post("/api/v1/fila-atendimento/checkin")
    create_client_com_user(v2).post("/api/v1/fila-atendimento/checkin")

    resp = create_client_com_user(v1).patch(
        "/api/v1/fila-atendimento/reordenar", json={"ordem": [v1.id]}
    )
    assert resp.status_code == 403  # v1 é VENDEDOR, não tem permissão de reordenar


def test_vendedor_nao_pode_reordenar(auth_client, db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.semperm@plannit.com.br")
    create_client_com_user(v1).post("/api/v1/fila-atendimento/checkin")

    resp = create_client_com_user(v1).patch(
        "/api/v1/fila-atendimento/reordenar", json={"ordem": [v1.id]}
    )
    assert resp.status_code == 403
