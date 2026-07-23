from datetime import datetime, timedelta
from app.models.crm import Arquiteto, Cliente, InteracaoArquiteto
from app.models.projeto import Projeto


def test_kpis_sem_dados(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["especificadores_ativos"] == 0
    assert data["pct_venda_mes"] == 0.0
    assert data["pct_venda_ano"] == 0.0
    assert data["atendimentos_mes"] == 0
    assert data["visitas_escritorio_mes"] == 0


def test_kpis_especificadores_ativos_conta_apenas_ativos(auth_client, db_session):
    ativo = Arquiteto(nome="Ativo", tipo="arquiteto", is_active=True)
    inativo = Arquiteto(nome="Inativo", tipo="arquiteto", is_active=False)
    db_session.add_all([ativo, inativo])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.json()["especificadores_ativos"] == 1


def test_kpis_pct_venda_mes(auth_client, db_session):
    arquiteto = Arquiteto(nome="Com Vendas", tipo="arquiteto", is_active=True)
    cliente = Cliente(nome="Cliente", telefone="11999990000")
    db_session.add_all([arquiteto, cliente])
    db_session.commit()

    agora = datetime.utcnow()
    projeto_com_especificador = Projeto(
        codigo="PROJ-2026-001", cliente_id=cliente.id, arquiteto_id=arquiteto.id,
        valor_contrato=100_000.0, criado_em=agora, arquivado=False,
    )
    projeto_sem_especificador = Projeto(
        codigo="PROJ-2026-002", cliente_id=cliente.id, arquiteto_id=None,
        valor_contrato=100_000.0, criado_em=agora, arquivado=False,
    )
    db_session.add_all([projeto_com_especificador, projeto_sem_especificador])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.json()["pct_venda_mes"] == 50.0


def test_kpis_atendimentos_e_visitas_mes(auth_client, db_session, diretoria_user):
    arquiteto = Arquiteto(nome="Com Interacoes", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()

    agora = datetime.utcnow()
    db_session.add_all([
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="V1", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="V2", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="ligacao", resumo="L1", data=agora),
        InteracaoArquiteto(
            arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="Mes passado",
            data=agora - timedelta(days=60),
        ),
    ])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    data = resp.json()
    assert data["visitas_escritorio_mes"] == 2
    assert data["atendimentos_mes"] == 1
