from fastapi.testclient import TestClient
from app.utils.rate_limiter import review_rate_limiter


def test_public_settings_retrieval(client: TestClient):
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "currency" in data
    assert "restaurant_name" in data
    assert "logo_url" in data


def test_admin_settings_unauthorized(client: TestClient):
    response = client.get("/api/v1/admin/settings")
    assert response.status_code == 401


def test_admin_settings_update_and_sync(client: TestClient, admin_headers: dict, test_location):
    # 1. Update settings
    payload = {
        "restaurant_name": "Antigravity Grand Hotel",
        "currency": "AED ",
        "logo_url": "https://i.ibb.co/test_logo.png",
    }
    update_res = client.put("/api/v1/admin/settings", json=payload, headers=admin_headers)
    assert update_res.status_code == 200
    res_data = update_res.json()["data"]
    assert res_data["currency"] == "AED "
    assert res_data["restaurant_name"] == "Antigravity Grand Hotel"
    assert res_data["logo_url"] == "https://i.ibb.co/test_logo.png"

    # 2. Check public settings reflect update
    public_res = client.get("/api/v1/settings")
    assert public_res.status_code == 200
    pub_data = public_res.json()["data"]
    assert pub_data["currency"] == "AED "
    assert pub_data["logo_url"] == "https://i.ibb.co/test_logo.png"

    # 3. Check customer menu location info reflects the updated currency and logo
    menu_res = client.get(f"/api/v1/menu/{test_location.qr_token}")
    assert menu_res.status_code == 200
    loc_data = menu_res.json()["location"]
    assert loc_data["currency"] == "AED "
    assert loc_data["logo_url"] == "https://i.ibb.co/test_logo.png"


def test_dish_reviews_pagination(client: TestClient, test_menu_item, mocker):
    mocker.patch.object(review_rate_limiter, "check_and_record", return_value=None)
    
    # Submit 2 test reviews with unique identifiers
    client.post(
        "/api/v1/reviews",
        json={
            "customer_name": "Patron One",
            "customer_identifier": "test_unique_id_1",
            "review_type": "MENU_ITEM",
            "menu_item_id": test_menu_item.id,
            "rating": 5,
            "review_text": "Exceptional food!",
        },
    )
    client.post(
        "/api/v1/reviews",
        json={
            "customer_name": "Patron Two",
            "customer_identifier": "test_unique_id_2",
            "review_type": "MENU_ITEM",
            "menu_item_id": test_menu_item.id,
            "rating": 4,
            "review_text": "Delicious recipe!",
        },
    )

    # Request page 1 with limit 1
    res_p1 = client.get(f"/api/v1/reviews?menu_item_id={test_menu_item.id}&page=1&limit=1")
    assert res_p1.status_code == 200
    json_p1 = res_p1.json()
    assert json_p1["success"] is True
    assert len(json_p1["data"]) == 1
    assert "pagination" in json_p1
    assert json_p1["pagination"]["page"] == 1
    assert json_p1["pagination"]["limit"] == 1
    assert json_p1["pagination"]["total"] >= 2
    assert json_p1["pagination"]["total_pages"] >= 2

    # Request page 2 with limit 1
    res_p2 = client.get(f"/api/v1/reviews?menu_item_id={test_menu_item.id}&page=2&limit=1")
    assert res_p2.status_code == 200
    json_p2 = res_p2.json()
    assert json_p2["pagination"]["page"] == 2
    assert len(json_p2["data"]) == 1
