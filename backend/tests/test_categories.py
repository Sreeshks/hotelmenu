from fastapi.testclient import TestClient


def test_public_get_categories(client: TestClient, test_category):
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert any(c["id"] == test_category.id for c in data["data"])


def test_admin_create_category(client: TestClient, admin_headers):
    payload = {
        "name": "Fresh Beverages",
        "description": "Chilled drinks and shakes",
        "display_order": 5,
        "is_active": True,
    }
    response = client.post("/api/v1/admin/categories", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Fresh Beverages"
    assert data["data"]["slug"] == "fresh-beverages"


def test_admin_update_category(client: TestClient, admin_headers, test_category):
    update_payload = {"name": "Gourmet Starters", "display_order": 2}
    response = client.put(
        f"/api/v1/admin/categories/{test_category.id}",
        json=update_payload,
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Gourmet Starters"


def test_admin_set_category_status(client: TestClient, admin_headers, test_category):
    response = client.patch(
        f"/api/v1/admin/categories/{test_category.id}/status",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_active"] is False


def test_admin_reorder_categories(client: TestClient, admin_headers, test_category):
    payload = [{"id": test_category.id, "display_order": 99}]
    response = client.patch("/api/v1/admin/categories/reorder", json=payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_admin_delete_category(client: TestClient, admin_headers, test_category):
    response = client.delete(f"/api/v1/admin/categories/{test_category.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Category must be permanently deleted from database
    get_res = client.get(f"/api/v1/admin/categories/{test_category.id}", headers=admin_headers)
    assert get_res.status_code == 404
