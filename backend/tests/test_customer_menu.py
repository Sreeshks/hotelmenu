from fastapi.testclient import TestClient


def test_customer_menu_retrieval(client: TestClient, test_location, test_category, test_menu_item):
    response = client.get(f"/api/v1/menu/{test_location.qr_token}")
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert data["location"]["name"] == test_location.name
    assert "categories" in data
    assert "menu_items" in data
    assert len(data["menu_items"]) >= 1


def test_customer_menu_invalid_token(client: TestClient):
    response = client.get("/api/v1/menu/invalid_random_token_123")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "LOCATION_NOT_FOUND"


def test_customer_menu_version_polling(client: TestClient, test_location):
    response = client.get(f"/api/v1/menu/{test_location.qr_token}/version")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert isinstance(data["version"], int)


def test_customer_menu_search(client: TestClient, test_location, test_menu_item):
    # Search via /api/v1/menu/search
    response = client.get(f"/api/v1/menu/search?search={test_menu_item.name[:4]}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert any(item["name"] == test_menu_item.name for item in data["data"])

    # Search via /api/v1/menu/{qr_token}/search
    response_token = client.get(f"/api/v1/menu/{test_location.qr_token}/search?search={test_menu_item.name}")
    assert response_token.status_code == 200
    token_data = response_token.json()
    assert token_data["success"] is True
    assert any(item["name"] == test_menu_item.name for item in token_data["data"])
