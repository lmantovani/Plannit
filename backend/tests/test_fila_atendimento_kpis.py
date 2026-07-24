from app.core.security import get_password_hash, get_current_user
from app.models.user import User, PerfilUsuario
from app.main import app as fastapi_app


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


def test_contador_leads_hoje(db_session, auth_client, create_client_com_user):
    vendedor = _criar_vendedor(db_session, "Vendedor Contador", "contador@plannit.com.br")
    client = create_client_com_user(vendedor)

    client.post("/api/v1/leads/", json={
        "nome": "Contado Um", "telefone": "11911113333", "origem": "showroom",
    })
    client.post("/api/v1/leads/", json={
        "nome": "Contado Dois", "telefone": "11922224444", "origem": "showroom",
    })

    resp = client.get("/api/v1/fila-atendimento/contador-hoje")
    assert resp.status_code == 200
    assert resp.json()["leads_atendidos_hoje"] == 2


def test_resumo_fila(db_session, diretoria_user, auth_client, create_client_com_user):
    vendedor = _criar_vendedor(db_session, "Vendedor Resumo", "resumo@plannit.com.br")
    create_client_com_user(vendedor).post("/api/v1/fila-atendimento/checkin")

    # Restore auth_client's get_current_user override (was changed by create_client_com_user)
    def _override_get_current_user():
        return diretoria_user
    fastapi_app.dependency_overrides[get_current_user] = _override_get_current_user

    auth_client.post("/api/v1/leads/", json={
        "nome": "Resumo Aguardando", "telefone": "11933335555", "origem": "whatsapp",
    })

    resp = auth_client.get("/api/v1/fila-atendimento/resumo")
    assert resp.status_code == 200
    body = resp.json()
    assert body["leads_aguardando"] == 1
    assert body["vendedores_disponiveis"] == 1
    assert body["tempo_medio_espera_minutos"] >= 0


def test_dashboard_expoe_resumo_fila(auth_client):
    resp = auth_client.get("/api/v1/dashboard/fila-atendimento")
    assert resp.status_code == 200
    assert "leads_aguardando" in resp.json()
