from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def test_gestor_le_config_com_defaults(auth_client):
    resp = auth_client.get("/api/v1/fila-atendimento/config")
    assert resp.status_code == 200
    assert resp.json() == {"minutos_alerta": 15, "minutos_escalonamento": 30}


def test_gestor_atualiza_limiares(auth_client):
    resp = auth_client.patch("/api/v1/fila-atendimento/config", json={"minutos_escalonamento": 45})
    assert resp.status_code == 200
    assert resp.json()["minutos_escalonamento"] == 45
    assert resp.json()["minutos_alerta"] == 15


def test_vendedor_nao_pode_ver_config(db_session, create_client_com_user):
    vendedor = User(
        nome="Vendedor Config", email="vendedor.config@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(vendedor)
    db_session.commit()

    resp = create_client_com_user(vendedor).get("/api/v1/fila-atendimento/config")
    assert resp.status_code == 403
