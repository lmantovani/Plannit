def test_listar_arquitetos_vazio(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/")
    assert resp.status_code == 200
    assert resp.json() == []
