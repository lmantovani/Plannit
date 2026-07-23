"""
Testes para integração de leads com especificadores — InteracaoArquiteto automática.
Task 6 da Frente A de Leads.
"""
import pytest


def test_lead_com_especificador_showroom_gera_visita_loja(auth_client):
    """Quando um lead é criado com arquiteto_id e origem=showroom,
    uma InteracaoArquiteto tipo VISITA_LOJA é registrada automaticamente."""
    arquiteto = auth_client.post("/api/v1/arquitetos/", json={
        "nome": "Ana Especificadora", "tipo": "arquiteto",
    }).json()

    resp = auth_client.post("/api/v1/leads/", json={
        "nome": "Cliente Indicado", "telefone": "11922223333", "origem": "showroom",
        "arquiteto_id": arquiteto["id"],
    })
    assert resp.status_code == 201

    interacoes = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes").json()
    assert len(interacoes) == 1
    assert interacoes[0]["tipo"] == "visita_loja"


def test_lead_com_especificador_whatsapp_gera_indicacao_lead(auth_client):
    """Quando um lead é criado com arquiteto_id e origem != showroom,
    uma InteracaoArquiteto tipo INDICACAO_LEAD é registrada automaticamente."""
    arquiteto = auth_client.post("/api/v1/arquitetos/", json={
        "nome": "Beto Especificador", "tipo": "engenheiro",
    }).json()

    resp = auth_client.post("/api/v1/leads/", json={
        "nome": "Cliente Whats", "telefone": "11944445555", "origem": "whatsapp",
        "arquiteto_id": arquiteto["id"],
    })
    assert resp.status_code == 201

    interacoes = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes").json()
    assert len(interacoes) == 1
    assert interacoes[0]["tipo"] == "indicacao_lead"


def test_lead_sem_especificador_nao_gera_interacao_arquiteto(auth_client):
    """Quando um lead é criado sem arquiteto_id,
    nenhuma InteracaoArquiteto é registrada."""
    resp = auth_client.post("/api/v1/leads/", json={
        "nome": "Cliente Sem Especificador", "telefone": "11966667777", "origem": "instagram",
    })
    assert resp.status_code == 201
