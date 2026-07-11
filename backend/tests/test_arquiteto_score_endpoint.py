from datetime import datetime, timedelta
from app.models.crm import Arquiteto, Lead, StatusFunil, ConcorrenteArquiteto
from app.models.projeto import Projeto, StatusProjeto


def test_score_arquiteto_sem_historico_e_inativo(auth_client, db_session):
    arquiteto = Arquiteto(nome="Sem Histórico")
    db_session.add(arquiteto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["segmento"] == "inativo"
    assert data["rfv"] == 0.0
    assert data["potencial"] == 0.0
    assert data["flags"] == []
    assert data["concorrencia"]["nivel"] == "baixo"
    assert data["concorrencia"]["concorrentes"] == []


def test_score_arquiteto_com_projeto_recente_e_valor_alto(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Alto Performer", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    cliente_id = _criar_cliente(db_session)
    projeto = Projeto(
        codigo="PROJ-TEST-001",
        cliente_id=cliente_id,
        arquiteto_id=arquiteto.id,
        status=StatusProjeto.CONCLUIDO,
        valor_contrato=800_000,
        criado_em=agora - timedelta(days=10),
    )
    db_session.add(projeto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["detalhes"]["recencia"] == 100
    assert data["detalhes"]["valor"] == 100
    assert "indicacao_alto_valor" in data["flags"]


def test_score_arquiteto_em_risco(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Sumiu", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    cliente_id = _criar_cliente(db_session)
    projeto = Projeto(
        codigo="PROJ-TEST-002",
        cliente_id=cliente_id,
        arquiteto_id=arquiteto.id,
        status=StatusProjeto.CONCLUIDO,
        valor_contrato=100_000,
        criado_em=agora - timedelta(days=400),
    )
    db_session.add(projeto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["segmento"] == "em_risco"
    assert "em_risco_de_perda" in data["flags"]


def test_score_inclui_concorrencia_sem_afetar_pilares(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Com Concorrente", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    concorrente = ConcorrenteArquiteto(
        arquiteto_id=arquiteto.id,
        nome_concorrente="Loja Rival",
        percentual_fechamento_estimado=90,
    )
    db_session.add(concorrente)
    db_session.commit()

    resp_sem_concorrente_no_score = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")
    data = resp_sem_concorrente_no_score.json()

    assert data["concorrencia"]["risco"] == 90
    assert data["concorrencia"]["nivel"] == "alto"
    assert len(data["concorrencia"]["concorrentes"]) == 1
    # concorrência não deve mexer nos pilares objetivos
    assert data["rfv"] == 0.0
    assert data["potencial"] == 0.0
    assert data["lealdade"] != None


def test_score_arquiteto_inexistente_404(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/9999/score")
    assert resp.status_code == 404


def _criar_cliente(db_session):
    from app.models.crm import Cliente
    cliente = Cliente(nome="Cliente Teste", telefone="11999999999")
    db_session.add(cliente)
    db_session.commit()
    return cliente.id
