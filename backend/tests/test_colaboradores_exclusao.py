from app.models.colaborador import HistoricoSalarialColaborador, HistoricoCargoColaborador, DocumentoColaborador
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def _desligar(auth_client, colaborador_id):
    return auth_client.post(
        f"/api/v1/colaboradores/{colaborador_id}/desligar",
        json={"data_desligamento": "2025-03-01", "tipo_desligamento": "pedido_demissao", "motivo_desligamento": "Motivo"},
    )


def test_excluir_colaborador_desligado_sucesso(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    _desligar(auth_client, criado["id"])

    resp = auth_client.delete(f"/api/v1/colaboradores/{criado['id']}")
    assert resp.status_code == 204

    assert auth_client.get(f"/api/v1/colaboradores/{criado['id']}").status_code == 404


def test_excluir_colaborador_ativo_bloqueado_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.delete(f"/api/v1/colaboradores/{criado['id']}")
    assert resp.status_code == 400

    # continua íntegro (a tentativa recusada não apagou nada)
    assert auth_client.get(f"/api/v1/colaboradores/{criado['id']}").status_code == 200


def test_excluir_colaborador_bloqueado_para_rh_403(create_client_com_user, rh_user, auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    _desligar(auth_client, criado["id"])

    rh_client = create_client_com_user(rh_user)
    resp = rh_client.delete(f"/api/v1/colaboradores/{criado['id']}")
    assert resp.status_code == 403

    # continua íntegro — só a Diretoria pode excluir
    assert auth_client.get(f"/api/v1/colaboradores/{criado['id']}").status_code == 200


def test_excluir_colaborador_desatrela_subordinados(auth_client):
    """Excluir um gestor não pode deixar os subordinados com uma FK órfã."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    gestor = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Gestora")
    ).json()
    payload_subordinado = _payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Subordinado")
    payload_subordinado["gestor_id"] = gestor["id"]
    subordinado = auth_client.post("/api/v1/colaboradores/", json=payload_subordinado).json()

    _desligar(auth_client, gestor["id"])
    resp = auth_client.delete(f"/api/v1/colaboradores/{gestor['id']}")
    assert resp.status_code == 204

    resp_subordinado = auth_client.get(f"/api/v1/colaboradores/{subordinado['id']}")
    assert resp_subordinado.status_code == 200
    assert resp_subordinado.json()["gestor_id"] is None
    assert resp_subordinado.json()["gestor_nome"] is None


def test_excluir_colaborador_remove_historico_e_documentos_vinculados(auth_client, db_session):
    """
    Verifica as linhas filhas diretamente no banco (não só o 204/404): o
    SQLite de teste roda sem PRAGMA foreign_keys=ON, então uma violação de FK
    real (Postgres em produção) não apareceria aqui se os .delete() do
    endpoint fossem removidos — só a ausência das linhas prova a cascata.
    """
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    cargo_novo = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Sênior", "departamento_id": dep["id"]}
    ).json()
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    colaborador_id = criado["id"]

    auth_client.post(
        f"/api/v1/colaboradores/{colaborador_id}/historico-salarial",
        json={"salario_clt": 4000.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador_id}/historico-cargo",
        json={"cargo_novo_id": cargo_novo["id"], "data": "2025-01-01", "justificativa": "Promoção"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador_id}/documentos",
        json={"tipo": "ctps", "url": "https://exemplo.com/ctps.pdf"},
    )

    _desligar(auth_client, colaborador_id)
    resp = auth_client.delete(f"/api/v1/colaboradores/{colaborador_id}")
    assert resp.status_code == 204
    assert auth_client.get(f"/api/v1/colaboradores/{colaborador_id}").status_code == 404

    assert db_session.query(HistoricoSalarialColaborador).filter_by(colaborador_id=colaborador_id).count() == 0
    assert db_session.query(HistoricoCargoColaborador).filter_by(colaborador_id=colaborador_id).count() == 0
    assert db_session.query(DocumentoColaborador).filter_by(colaborador_id=colaborador_id).count() == 0
