from datetime import datetime, timedelta, timezone
from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, OrigemLead, ConfigFilaAtendimento
from app.models.notificacao import Notificacao, TipoNotificacao


def test_lead_recente_sem_alerta(auth_client, db_session):
    auth_client.post("/api/v1/leads/", json={
        "nome": "Recente", "telefone": "11911119999", "origem": "whatsapp",
    })

    resp = auth_client.get("/api/v1/leads/aguardando")
    assert resp.status_code == 200
    assert resp.json()[0]["alerta"] is False


def test_lead_antigo_gera_alerta_e_escalonamento(db_session, auth_client):
    db_session.add(ConfigFilaAtendimento(minutos_alerta=15, minutos_escalonamento=30))
    db_session.commit()

    lead = Lead(
        nome="Esquecido", telefone="11922228888", origem=OrigemLead.WHATSAPP,
        criado_em=datetime.now(timezone.utc) - timedelta(minutes=40),
    )
    db_session.add(lead)
    db_session.commit()

    recepcao = User(
        nome="Recepção Alerta", email="recepcao.alerta@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RECEPCAO, is_active=True,
    )
    db_session.add(recepcao)
    db_session.commit()

    resp = auth_client.get("/api/v1/leads/aguardando")
    body = resp.json()
    assert body[0]["alerta"] is True
    assert body[0]["minutos_esperando"] >= 40

    notifs = db_session.query(Notificacao).filter(
        Notificacao.tipo == TipoNotificacao.LEAD_AGUARDANDO_ESCALONADO
    ).all()
    assert len(notifs) == 2  # recepção criada + admin (diretoria) do auth_client


def test_escalonamento_nao_duplica_notificacao(db_session, auth_client):
    lead = Lead(
        nome="Repetido", telefone="11933337777", origem=OrigemLead.WHATSAPP,
        criado_em=datetime.now(timezone.utc) - timedelta(minutes=40),
    )
    db_session.add(lead)
    db_session.commit()

    auth_client.get("/api/v1/leads/aguardando")
    auth_client.get("/api/v1/leads/aguardando")

    notifs = db_session.query(Notificacao).filter(
        Notificacao.tipo == TipoNotificacao.LEAD_AGUARDANDO_ESCALONADO
    ).all()
    assert len(notifs) == 1  # só o admin (diretoria) existe neste teste — não duplicou na segunda leitura
