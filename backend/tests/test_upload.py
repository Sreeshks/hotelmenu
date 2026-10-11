import io
from fastapi.testclient import TestClient


def test_upload_valid_category_image(client: TestClient, admin_headers, test_category):
    # Minimal 1x1 transparent PNG bytes
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    response = client.post(
        f"/api/v1/admin/categories/{test_category.id}/image",
        files=files,
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "ibb.co" in data["data"]["image"] or "/uploads/categories/" in data["data"]["image"]


def test_admin_upload_image_endpoint(client: TestClient, admin_headers):
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {"file": ("menu_photo.png", io.BytesIO(png_bytes), "image/png")}
    response = client.post(
        "/api/v1/admin/upload-image",
        files=files,
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "ibb.co" in data["data"] or "/uploads/" in data["data"]


def test_upload_invalid_extension(client: TestClient, admin_headers, test_category):
    files = {"file": ("test.exe", io.BytesIO(b"malicious executable"), "application/octet-stream")}
    response = client.post(
        f"/api/v1/admin/categories/{test_category.id}/image",
        files=files,
        headers=admin_headers,
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FILE_EXTENSION"


def test_upload_forged_image(client: TestClient, admin_headers, test_category):
    # Extension says .png but content is plain text
    files = {"file": ("fake.png", io.BytesIO(b"this is not a real png image"), "image/png")}
    response = client.post(
        f"/api/v1/admin/categories/{test_category.id}/image",
        files=files,
        headers=admin_headers,
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "CORRUPT_OR_FORGED_IMAGE"
