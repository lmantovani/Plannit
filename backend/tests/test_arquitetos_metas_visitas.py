from datetime import datetime, timedelta
from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.crm import InteracaoArquiteto, Arquiteto


def _criar_vendedor(db_session, nome="Vendedor Meta", email="vendedor.meta@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_definir_meta_visitas(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)

    resp = auth_client.put(
        "/api/v1/arquitetos/metas-visitas",
        json={"consultor_id": vendedor.id, "meta_visitas_mes": 10},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["consultor_id"] == vendedor.id
    assert data["consultor_nome"] == vendedor.nome
    assert data["meta_visitas_mes"] == 10


def test_definir_meta_visitas_upsert(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)

    auth_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 10})
    resp = auth_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 15})

    assert resp.status_code == 200
    assert resp.json()["meta_visitas_mes"] == 15

    listagem = auth_client.get("/api/v1/arquitetos/metas-visitas").json()
    assert len(listagem) == 1


def test_definir_meta_visitas_bloqueado_403(create_client_com_user, projetista_user, db_session):
    vendedor = _criar_vendedor(db_session)
    projetista_client = create_client_com_user(projetista_user)

    resp = projetista_client.put(
        "/api/v1/arquitetos/metas-visitas",
        json={"consultor_id": vendedor.id, "meta_visitas_mes": 10},
    )
    assert resp.status_code == 403


def test_minha_meta_sem_meta_configurada(create_client_com_user, db_session):
    vendedor = _criar_vendedor(db_session)
    vendedor_client = create_client_com_user(vendedor)

    resp = vendedor_client.get("/api/v1/arquitetos/metas-visitas/me")
    assert resp.status_code == 200
    assert resp.json() == {"meta_visitas_mes": 0, "visitas_realizadas_mes": 0}


def test_minha_meta_com_progresso(auth_client, create_client_com_user, db_session):
    vendedor = _criar_vendedor(db_session)
    arquiteto = Arquiteto(nome="Alvo Visita", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()

    agora = datetime.utcnow()
    db_session.add_all([
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita_escritorio", resumo="V1", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita_escritorio", resumo="V2", data=agora),
        InteracaoArquiteto(
            arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita_escritorio", resumo="Mes passado",
            data=agora - timedelta(days=60),
        ),
    ])
    db_session.commit()

    # Definir metas exige DIRETORIA/GERENTE_COMERCIAL — o proprio vendedor so consulta (GET /me).
    auth_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 5})

    vendedor_client = create_client_com_user(vendedor)
    resp = vendedor_client.get("/api/v1/arquitetos/metas-visitas/me")
    assert resp.status_code == 200
    assert resp.json() == {"meta_visitas_mes": 5, "visitas_realizadas_mes": 2}
