import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_contract() -> None:
    response = client.post("/api/v1/analyze", json={"text": "Bro rep DBMS exam undha?"})
    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1.0"
    assert body["code_switching"]["detected"] is True
    assert body["tokens"]


@pytest.mark.parametrize("payload", [{"text": ""}, {"text": "   "}, {"text": "x" * 1001}])
def test_invalid_input_returns_422(payload: dict[str, str]) -> None:
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422


def test_examples() -> None:
    response = client.get("/api/v1/examples")
    assert response.status_code == 200
    assert len(response.json()) == 5
