from __future__ import annotations

from fastapi.testclient import TestClient

from app import main


class FailingSignalService:
    async def get_signals(self, hours: int):
        raise RuntimeError("internal detail http://secret-internal-host/api?token=abc123")


def test_signal_failure_returns_sanitized_502(monkeypatch) -> None:
    monkeypatch.setattr(main, "signal_service", FailingSignalService())
    client = TestClient(main.app)

    response = client.get("/api/signals?hours=24")

    assert response.status_code == 502
    body = response.json()
    assert body["detail"] == main.UPSTREAM_ERROR_DETAIL
    assert "secret-internal-host" not in response.text
    assert "token" not in response.text


def test_recommendation_failure_returns_sanitized_502(monkeypatch) -> None:
    monkeypatch.setattr(main, "signal_service", FailingSignalService())
    client = TestClient(main.app)

    response = client.get("/api/recommendations")

    assert response.status_code == 502
    assert response.json()["detail"] == main.UPSTREAM_ERROR_DETAIL
    assert "secret-internal-host" not in response.text
