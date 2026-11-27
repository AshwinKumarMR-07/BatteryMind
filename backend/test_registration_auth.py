import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    fd, database_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["BATTERY_MIND_DATABASE_URL"] = f"sqlite:///{database_path}"
    os.environ["BATTERY_MIND_ADMIN_USERNAME"] = "admin"
    os.environ["BATTERY_MIND_ADMIN_PASSWORD"] = "ChangeMe123!"
    os.environ["BATTERY_MIND_ADMIN_EMAIL"] = "admin@batterymind.local"

    from main import app
    from database import engine

    with TestClient(app) as test_client:
        yield test_client

    engine.dispose()
    try:
        os.unlink(database_path)
    except PermissionError:
        pass


def register(client, username, email):
    return client.post("/api/auth/register", json={
        "full_name": "Test BatteryMind User",
        "username": username,
        "email": email,
        "password": "Secure123!",
        "confirm_password": "Secure123!",
    })


def login(client, username, password):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def test_registration_login_and_viewer_role(client):
    response = register(client, "viewer_test", "viewer_test@example.com")
    assert response.status_code == 200
    user = response.json()
    assert user["role"] == "Viewer"
    assert user["email"] == "viewer_test@example.com"

    authenticated = login(client, "viewer_test", "Secure123!")
    assert authenticated.status_code == 200
    assert authenticated.json()["user"]["role"] == "Viewer"


def create_battery(client, headers, code):
    return client.post("/api/batteries", headers=headers, json={
        "battery_code": code,
        "vehicle_category": "Electric cars",
        "model_name": f"Test {code}",
        "manufacturer": "BatteryMind Test",
        "nominal_capacity_ah": 100,
        "nominal_voltage": 400,
        "chemistry": "NMC",
        "cycle_count": 0,
        "current_soh": 100,
        "status": "Normal",
    })


def test_accounts_have_isolated_batteries_and_dashboard_data(client):
    account_a = login(client, "viewer_test", "Secure123!")
    headers_a = {"Authorization": f"Bearer {account_a.json()['access_token']}"}

    empty_stats = client.get("/api/dashboard/stats", headers=headers_a).json()
    assert empty_stats["total_batteries"] == 0
    assert empty_stats["average_soh"] == 0
    assert empty_stats["warning_count"] == 0
    assert empty_stats["critical_count"] == 0
    assert client.get("/api/batteries", headers=headers_a).json() == []

    battery_a1 = create_battery(client, headers_a, "ACCOUNT-A-1")
    battery_a2 = create_battery(client, headers_a, "ACCOUNT-A-2")
    assert battery_a1.status_code == 200
    assert battery_a2.status_code == 200
    assert client.get("/api/dashboard/stats", headers=headers_a).json()["total_batteries"] == 2

    registered_b = register(client, "account_b", "account_b@example.com")
    assert registered_b.status_code == 200
    account_b = login(client, "account_b", "Secure123!")
    headers_b = {"Authorization": f"Bearer {account_b.json()['access_token']}"}
    assert client.get("/api/dashboard/stats", headers=headers_b).json()["total_batteries"] == 0
    assert client.get("/api/batteries", headers=headers_b).json() == []

    foreign_id = battery_a1.json()["id"]
    assert client.get(f"/api/batteries/{foreign_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/batteries/{foreign_id}/readings", headers=headers_b).status_code == 404
    assert client.get(f"/api/ai/forecast/{foreign_id}", headers=headers_b).status_code == 404
    assert client.post(f"/api/simulate-telemetry/{foreign_id}", headers=headers_b).status_code == 404
    assert client.post("/api/readings", headers=headers_b, json={
        "battery_id": foreign_id,
        "voltage": 400,
        "current": 10,
        "temperature": 25,
        "soc": 80,
        "capacity_remaining_ah": 80,
    }).status_code == 404

    battery_b = create_battery(client, headers_b, "ACCOUNT-B-1")
    assert battery_b.status_code == 200
    assert client.get("/api/dashboard/stats", headers=headers_b).json()["total_batteries"] == 1
    assert client.get("/api/dashboard/stats", headers=headers_a).json()["total_batteries"] == 2


def test_profile_edit_and_password_change(client):
    authenticated = login(client, "viewer_test", "Secure123!")
    headers = {"Authorization": f"Bearer {authenticated.json()['access_token']}"}

    updated = client.patch("/api/auth/profile", headers=headers, json={
        "full_name": "Updated Viewer",
        "email": "updated_viewer@example.com",
    })
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated Viewer"
    assert updated.json()["email"] == "updated_viewer@example.com"

    changed = client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "Secure123!",
        "new_password": "Updated123!",
        "confirm_new_password": "Updated123!",
    })
    assert changed.status_code == 200
    assert login(client, "viewer_test", "Secure123!").status_code == 401
    assert login(client, "viewer_test", "Updated123!").status_code == 200


def test_duplicate_email_and_incorrect_password(client):
    duplicate = register(client, "another_user", "updated_viewer@example.com")
    assert duplicate.status_code == 409

    wrong_password = login(client, "viewer_test", "Secure123!")
    assert wrong_password.status_code == 401


def test_viewer_cannot_access_admin_api(client):
    authenticated = login(client, "viewer_test", "Updated123!")
    headers = {"Authorization": f"Bearer {authenticated.json()['access_token']}"}

    response = client.get("/api/users", headers=headers)
    assert response.status_code == 403


def test_admin_can_promote_user(client):
    admin = login(client, "admin", "ChangeMe123!")
    assert admin.status_code == 200
    headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}

    users = client.get("/api/users", headers=headers)
    assert users.status_code == 200
    viewer = next(user for user in users.json() if user["username"] == "viewer_test")

    promoted = client.patch(
        f"/api/users/{viewer['id']}",
        headers=headers,
        json={"role": "Operator"},
    )
    assert promoted.status_code == 200
    assert promoted.json()["role"] == "Operator"


def test_device_registration_pairing_and_revocation(client):
    registered = register(client, "device_owner", "device_owner@example.com")
    assert registered.status_code == 200
    authenticated = login(client, "device_owner", "Secure123!")
    headers = {"Authorization": f"Bearer {authenticated.json()['access_token']}"}

    battery = create_battery(client, headers, "DEVICE-PAIRING-BATTERY")
    assert battery.status_code == 200
    device = client.post("/api/devices", headers=headers, json={
        "name": "Test BMS",
        "device_identifier": "BMS-PAIR-001",
    })
    assert device.status_code == 200
    pending = device.json()
    assert pending["pairing_status"] == "Pairing Pending"
    assert pending["is_active"] is True
    assert pending["is_revoked"] is False

    listed_devices = client.get("/api/devices", headers=headers)
    assert listed_devices.status_code == 200
    assert any(item["id"] == pending["id"] for item in listed_devices.json())

    paired = client.post(
        f"/api/devices/{pending['id']}/pair",
        headers=headers,
        json={"battery_id": battery.json()["id"]},
    )
    assert paired.status_code == 200
    assert paired.json()["pairing_status"] == "Paired"
    assert paired.json()["battery_id"] == battery.json()["id"]

    revoked = client.post(f"/api/devices/{pending['id']}/revoke", headers=headers)
    assert revoked.status_code == 200
    assert revoked.json()["is_revoked"] is True
    assert revoked.json()["is_active"] is False
    assert client.post(
        f"/api/devices/{pending['id']}/pair",
        headers=headers,
        json={"battery_id": battery.json()["id"]},
    ).status_code == 409
