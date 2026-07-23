from datetime import datetime, timedelta
from app.services.arquiteto_score import determinar_flags
from app.models.crm import Arquiteto, InteracaoArquiteto, Cliente
from app.models.projeto import Projeto


def test_esfriando_quando_em_risco_com_dono_e_sem_interacao_recente():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" in flags


def test_esfriando_quando_nunca_houve_interacao():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=None,
    )
    assert "especificador_esfriando" in flags


def test_nao_esfria_sem_dono():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=False, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" not in flags


def test_nao_esfria_se_nao_em_risco():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=False,
        tem_dono=True, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" not in flags


def test_nao_esfria_com_interacao_recente():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=10,
    )
    assert "especificador_esfriando" not in flags


def test_score_endpoint_inclui_flag_esfriando(auth_client, db_session, diretoria_user):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(
        nome="Esfriando", tipo="arquiteto", is_active=True,
        criado_em=agora - timedelta(days=800), consultor_id=diretoria_user.id,
    )
    cliente = Cliente(nome="Cliente", telefone="11999990000")
    db_session.add_all([arquiteto, cliente])
    db_session.commit()

    # projeto antigo o suficiente para gerar em_risco=True (>180 dias sem atividade)
    db_session.add(Projeto(
        codigo="PROJ-2024-001", cliente_id=cliente.id, arquiteto_id=arquiteto.id,
        valor_contrato=50_000.0, criado_em=agora - timedelta(days=400), arquivado=False,
    ))
    db_session.add(InteracaoArquiteto(
        arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id,
        tipo="ligacao", resumo="Contato antigo", data=agora - timedelta(days=60),
    ))
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")
    assert resp.status_code == 200
    assert "especificador_esfriando" in resp.json()["flags"]
