from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from app import main
from app.models import ForecastPoint, SignalSnapshot
from app.scoring.appliances import get_appliance_profile, list_appliance_profiles, resolve_appliance_request

BRUSSELS = ZoneInfo("Europe/Brussels")


def make_point(index: int) -> ForecastPoint:
    timestamp = datetime(2026, 7, 1, 10, 0, tzinfo=UTC) + timedelta(minutes=15 * index)
    renewable = 500 if index >= 8 else 100
    load = 900 if index >= 8 else 1200
    return ForecastPoint(
        timestamp_utc=timestamp,
        timestamp_brussels=timestamp.astimezone(BRUSSELS),
        load_forecast_mw=load,
        pv_forecast_mw=renewable * 0.75,
        wind_forecast_mw=renewable * 0.25,
        renewable_forecast_mw=renewable,
        renewable_share_of_load=renewable / load,
        price_eur_mwh=50 if index >= 8 else 150,
        price_provider="test-provider",
    )


class StubSignalService:
    async def get_signals(self, hours: int) -> SignalSnapshot:
        generated_at = datetime(2026, 7, 1, 9, 0, tzinfo=UTC)
        return SignalSnapshot(
            generated_at_utc=generated_at,
            generated_at_brussels=generated_at.astimezone(BRUSSELS),
            points=[make_point(index) for index in range(24)],
            freshness=[],
        )


def test_appliance_catalog_includes_ev_power_options() -> None:
    profiles = list_appliance_profiles()
    ev_profile = get_appliance_profile("ev_charging")

    assert len(profiles) >= 7
    assert ev_profile is not None
    assert ev_profile.default_duration_minutes == 240
    assert ev_profile.power_options_kw == [3.7, 7.4, 11.0]
    assert ev_profile.peak_relevance == "very high"


def test_resolve_appliance_request_uses_defaults_and_estimates_energy() -> None:
    resolved = resolve_appliance_request("dryer", duration_minutes=None, power_kw=None)

    assert resolved.duration_minutes == 90
    assert resolved.power_kw == 2.2
    assert resolved.impact is not None
    assert resolved.impact.estimated_energy_kwh == 3.3
    assert resolved.impact.peak_relevance == "high"


def test_resolve_appliance_request_allows_power_override() -> None:
    resolved = resolve_appliance_request("ev_charging", duration_minutes=120, power_kw=11.0)

    assert resolved.duration_minutes == 120
    assert resolved.power_kw == 11.0
    assert resolved.impact is not None
    assert resolved.impact.estimated_energy_kwh == 22.0


def test_appliances_endpoint_returns_catalog() -> None:
    client = TestClient(main.app)

    response = client.get("/api/appliances")

    assert response.status_code == 200
    data = response.json()
    assert {item["id"] for item in data} >= {"dishwasher", "ev_charging", "custom"}


def test_unknown_appliance_id_returns_404() -> None:
    client = TestClient(main.app)

    response = client.get("/api/recommendations", params={"appliance_id": "unknown"})

    assert response.status_code == 404



def test_recommendation_endpoint_includes_appliance_impact(monkeypatch) -> None:
    monkeypatch.setattr(main, "signal_service", StubSignalService())
    client = TestClient(main.app)

    response = client.get(
        "/api/recommendations",
        params={
            "appliance_id": "ev_charging",
            "power_kw": "11",
            "deadline": "2026-07-01T18:00:00+02:00",
            "mode": "balanced",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["duration_minutes"] == 240
    assert data["appliance"]["id"] == "ev_charging"
    assert data["appliance_impact"]["assumed_power_kw"] == 11.0
    assert data["appliance_impact"]["estimated_energy_kwh"] == 44.0
    assert "15-minute peak" in data["appliance_impact"]["capacity_tariff_note"]
    assert any("High-power appliance" in explanation for explanation in data["best_window"]["explanations"])
