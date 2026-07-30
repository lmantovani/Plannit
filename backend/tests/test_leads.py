from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Teste", email="vendedor.leads@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_listar_leads_filtro_por_arquiteto_id(auth_client):
    """Fix 5 — GET /leads/?arquiteto_id=X deve retornar apenas leads gerados por esse especificador."""
    arquiteto1 = _criar_arquiteto(auth_client, "Especificador 1")
    arquiteto2 = _criar_arquiteto(auth_client, "Especificador 2")

    lead1 = auth_client.post(
        "/api/v1/leads/",
        json={"nome": "Lead do Especificador 1", "telefone": "11999990001", "arquiteto_id": arquiteto1["id"]},
    ).json()
    auth_client.post(
        "/api/v1/leads/",
        json={"nome": "Lead do Especificador 2", "telefone": "11999990002", "arquiteto_id": arquiteto2["id"]},
    )

    resp = auth_client.get("/api/v1/leads/", params={"arquiteto_id": arquiteto1["id"]})
    assert resp.status_code == 200
    ids = [l["id"] for l in resp.json()]
    assert lead1["id"] in ids
    assert len(resp.json()) == 1
    assert resp.json()[0]["nome"] == "Lead do Especificador 1"


def test_listar_leads_filtro_por_arquiteto_id_inclui_convertidos(auth_client, db_session):
    """Leads convertidos em cliente normalmente são excluídos de GET /leads/, mas devem
    aparecer quando filtrando por arquiteto_id — o objetivo é mostrar todos os leads que
    o especificador gerou, convertidos ou não."""
    from app.models.crm import Lead

    arquiteto = _criar_arquiteto(auth_client)
    lead = auth_client.post(
        "/api/v1/leads/",
        json={"nome": "Lead Convertido", "telefone": "11999990003", "arquiteto_id": arquiteto["id"]},
    ).json()

    lead_db = db_session.query(Lead).filter(Lead.id == lead["id"]).first()
    lead_db.convertido_em_cliente = True
    db_session.commit()

    # sem filtro por arquiteto_id, o convertido não aparece
    resp_sem_filtro = auth_client.get("/api/v1/leads/")
    assert lead["id"] not in [l["id"] for l in resp_sem_filtro.json()]

    # com filtro por arquiteto_id, o convertido aparece
    resp = auth_client.get("/api/v1/leads/", params={"arquiteto_id": arquiteto["id"]})
    assert resp.status_code == 200
    assert lead["id"] in [l["id"] for l in resp.json()]


def test_listar_leads_filtro_por_arquiteto_id_visibilidade_aberta_entre_vendedores(
    auth_client, create_client_com_user, db_session,
):
    """Visibilidade aberta: um vendedor deve ver leads gerados por um especificador mesmo
    que o lead pertença à carteira de outro vendedor."""
    arquiteto = _criar_arquiteto(auth_client)
    vendedor_dono = _criar_vendedor(db_session, "Vendedor Dono", "dono.leads@plannit.com.br")
    outro_vendedor = _criar_vendedor(db_session, "Outro Vendedor", "outro.leads@plannit.com.br")

    lead = auth_client.post(
        "/api/v1/leads/",
        json={
            "nome": "Lead de Outro Vendedor",
            "telefone": "11999990004",
            "arquiteto_id": arquiteto["id"],
            "vendedor_id": vendedor_dono.id,
        },
    ).json()

    outro_vendedor_client = create_client_com_user(outro_vendedor)
    resp = outro_vendedor_client.get("/api/v1/leads/", params={"arquiteto_id": arquiteto["id"]})
    assert resp.status_code == 200
    assert lead["id"] in [l["id"] for l in resp.json()]
