from fastapi.testclient import TestClient

from app.main import app

# The client is intentionally not used as a context manager: that keeps the
# lifespan (and therefore the database connection) out of these tests.
client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert isinstance(payload["timestamp"], int)
