import pytest
from datetime import date, datetime, timezone
from sqlalchemy.exc import IntegrityError

from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.crm import (
    Lead, OrigemLead, TipoInteracaoArquiteto,
    FilaAtendimento, ConfigFilaAtendimento, MotivoIndisponibilidade,
)
from app.models.notificacao import TipoNotificacao


def _criar_vendedor(db_session, email="vendedor.fila@plannit.com.br"):
    user = User(
        nome="Vendedor Fila", email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_fila_atendimento_criar_com_defaults(db_session):
    vendedor = _criar_vendedor(db_session)
    fila = FilaAtendimento(vendedor_id=vendedor.id, posicao=1)
    db_session.add(fila)
    db_session.commit()
    db_session.refresh(fila)

    assert fila.disponivel is True
    assert fila.ativo_hoje is False
    assert fila.vendedor_nome == "Vendedor Fila"


def test_fila_atendimento_vendedor_id_unico(db_session):
    vendedor = _criar_vendedor(db_session)
    db_session.add(FilaAtendimento(vendedor_id=vendedor.id, posicao=1))
    db_session.commit()

    db_session.add(FilaAtendimento(vendedor_id=vendedor.id, posicao=2))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_fila_atendimento_motivo_indisponivel(db_session):
    vendedor = _criar_vendedor(db_session)
    fila = FilaAtendimento(
        vendedor_id=vendedor.id, posicao=1, disponivel=False,
        motivo_indisponivel_categoria=MotivoIndisponibilidade.ALMOCO,
        data_referencia=date.today(),
    )
    db_session.add(fila)
    db_session.commit()
    db_session.refresh(fila)

    assert fila.motivo_indisponivel_categoria == MotivoIndisponibilidade.ALMOCO


def test_config_fila_atendimento_defaults(db_session):
    config = ConfigFilaAtendimento()
    db_session.add(config)
    db_session.commit()
    db_session.refresh(config)

    assert config.minutos_alerta == 15
    assert config.minutos_escalonamento == 30


def test_lead_criado_por_e_novas_origens(db_session):
    vendedor = _criar_vendedor(db_session, email="vendedor.origem@plannit.com.br")
    lead = Lead(
        nome="Cliente Whatsapp", telefone="11988887777",
        origem=OrigemLead.WHATSAPP, criado_por_id=vendedor.id,
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)

    assert lead.origem == OrigemLead.WHATSAPP
    assert lead.criado_por.id == vendedor.id


def test_tipo_interacao_arquiteto_indicacao_lead():
    assert TipoInteracaoArquiteto.INDICACAO_LEAD.value == "indicacao_lead"


def test_tipo_notificacao_lead_escalonado():
    assert TipoNotificacao.LEAD_AGUARDANDO_ESCALONADO.value == "lead_aguardando_escalonado"
