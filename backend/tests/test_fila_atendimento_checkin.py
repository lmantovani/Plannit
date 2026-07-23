from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_vendedor(db_session, nome="Vendedor Um", email="v1.checkin@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_checkin_cria_registro_na_fila(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    client = create_client_com_user(vendedor)

    resp = client.post("/api/v1/fila-atendimento/checkin")
    assert resp.status_code == 200
    body = resp.json()
    assert body["vendedor_id"] == vendedor.id
    assert body["posicao"] == 1
    assert body["disponivel"] is True
    assert body["ativo_hoje"] is True


def test_checkin_segundo_vendedor_vai_pro_final(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.ordem@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.ordem@plannit.com.br")

    create_client_com_user(v1).post("/api/v1/fila-atendimento/checkin")
    resp = create_client_com_user(v2).post("/api/v1/fila-atendimento/checkin")

    assert resp.json()["posicao"] == 2


def test_checkout_mantem_posicao_mas_fica_inativo(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    client = create_client_com_user(vendedor)
    client.post("/api/v1/fila-atendimento/checkin")

    resp = client.post("/api/v1/fila-atendimento/checkout")
    assert resp.status_code == 200
    assert resp.json()["ativo_hoje"] is False

    lista = client.get("/api/v1/fila-atendimento/vendedores")
    assert lista.json() == []


def test_checkout_sem_checkin_retorna_404(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    resp = create_client_com_user(vendedor).post("/api/v1/fila-atendimento/checkout")
    assert resp.status_code == 404


def test_marcar_indisponivel_com_categoria_outro_exige_observacao(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    client = create_client_com_user(vendedor)
    client.post("/api/v1/fila-atendimento/checkin")

    resp = client.post("/api/v1/fila-atendimento/indisponivel", json={"categoria": "outro"})
    assert resp.status_code == 422


def test_marcar_indisponivel_mantem_posicao(db_session, create_client_com_user):
    v1 = _criar_vendedor(db_session, "Um", "v1.indisp@plannit.com.br")
    v2 = _criar_vendedor(db_session, "Dois", "v2.indisp@plannit.com.br")

    create_client_com_user(v1).post("/api/v1/fila-atendimento/checkin")
    create_client_com_user(v2).post("/api/v1/fila-atendimento/checkin")

    resp = create_client_com_user(v1).post("/api/v1/fila-atendimento/indisponivel", json={"categoria": "almoco"})
    assert resp.status_code == 200
    assert resp.json()["posicao"] == 1
    assert resp.json()["disponivel"] is False

    lista = create_client_com_user(v1).get("/api/v1/fila-atendimento/vendedores").json()
    posicoes = {item["vendedor_id"]: item["posicao"] for item in lista}
    assert posicoes[v1.id] == 1


def test_marcar_disponivel_de_volta(db_session, create_client_com_user):
    vendedor = _criar_vendedor(db_session)
    client = create_client_com_user(vendedor)
    client.post("/api/v1/fila-atendimento/checkin")
    client.post("/api/v1/fila-atendimento/indisponivel", json={"categoria": "almoco"})

    resp = client.post("/api/v1/fila-atendimento/disponivel")
    assert resp.status_code == 200
    assert resp.json()["disponivel"] is True


def test_gestor_nao_pode_fazer_checkin(auth_client):
    resp = auth_client.post("/api/v1/fila-atendimento/checkin")
    assert resp.status_code == 403
