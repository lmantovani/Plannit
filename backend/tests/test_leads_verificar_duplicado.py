def test_verificar_duplicado_sem_correspondencia(auth_client):
    resp = auth_client.get("/api/v1/leads/verificar-duplicado", params={"telefone": "11900000000"})
    assert resp.status_code == 200
    assert resp.json() == {"duplicado": False, "existente": None}


def test_verificar_duplicado_encontra_lead_existente(auth_client):
    auth_client.post("/api/v1/leads/", json={
        "nome": "Original", "telefone": "11988887777", "origem": "instagram",
    })

    resp = auth_client.get("/api/v1/leads/verificar-duplicado", params={"telefone": "11988887777"})
    body = resp.json()
    assert body["duplicado"] is True
    assert body["existente"]["tipo"] == "lead"
    assert body["existente"]["nome"] == "Original"
