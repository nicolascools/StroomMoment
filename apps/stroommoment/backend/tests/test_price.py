from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.api_clients.energy_charts import build_energy_charts_freshness, parse_energy_charts_prices
from app.models import ForecastPoint, PricePoint
from app.services.normalization import attach_prices_to_points

BRUSSELS = ZoneInfo("Europe/Brussels")


def make_point(index: int) -> ForecastPoint:
    timestamp = datetime(2026, 7, 1, 10, 0, tzinfo=UTC) + timedelta(minutes=15 * index)
    return ForecastPoint(
        timestamp_utc=timestamp,
        timestamp_brussels=timestamp.astimezone(BRUSSELS),
        load_forecast_mw=1000,
        renewable_forecast_mw=200,
    )


def test_parse_energy_charts_price_response() -> None:
    payload = {
        "license_info": "CC BY 4.0",
        "unix_seconds": [1782871200, 1782872100],
        "price": [130.78, None],
        "unit": "EUR / MWh",
        "deprecated": False,
    }

    prices = parse_energy_charts_prices(payload, fetched_at_utc=datetime(2026, 7, 1, 12, 0, tzinfo=UTC))

    assert len(prices) == 1
    assert prices[0].timestamp_utc.isoformat() == "2026-07-01T02:00:00+00:00"
    assert prices[0].timestamp_brussels.isoformat() == "2026-07-01T04:00:00+02:00"
    assert prices[0].price_eur_mwh == 130.78
    assert prices[0].provider == "energy-charts"


def test_hourly_price_aligns_to_15_minute_forecast_points() -> None:
    points = [make_point(index) for index in range(4)]
    price = PricePoint(
        timestamp_utc=datetime(2026, 7, 1, 10, 0, tzinfo=UTC),
        timestamp_brussels=datetime(2026, 7, 1, 12, 0, tzinfo=BRUSSELS),
        price_eur_mwh=42.0,
        provider="test-provider",
        source_name="test",
    )

    enriched = attach_prices_to_points(points, [price])

    assert [point.price_eur_mwh for point in enriched] == [42.0, 42.0, 42.0, 42.0]
    assert [point.price_score for point in enriched] == [0.5, 0.5, 0.5, 0.5]


def test_quarter_hour_price_scores_lower_prices_higher() -> None:
    points = [make_point(index) for index in range(2)]
    prices = [
        PricePoint(
            timestamp_utc=points[0].timestamp_utc,
            timestamp_brussels=points[0].timestamp_brussels,
            price_eur_mwh=100.0,
            provider="test-provider",
            source_name="test",
        ),
        PricePoint(
            timestamp_utc=points[1].timestamp_utc,
            timestamp_brussels=points[1].timestamp_brussels,
            price_eur_mwh=200.0,
            provider="test-provider",
            source_name="test",
        ),
    ]

    enriched = attach_prices_to_points(points, prices)

    assert enriched[0].price_score == 1.0
    assert enriched[1].price_score == 0.0


def test_energy_charts_freshness_includes_latest_timestamp_and_source_link() -> None:
    fetched_at = datetime(2026, 7, 1, 12, 0, tzinfo=UTC)
    prices = [
        PricePoint(
            timestamp_utc=datetime(2026, 7, 1, 10, 0, tzinfo=UTC),
            timestamp_brussels=datetime(2026, 7, 1, 12, 0, tzinfo=BRUSSELS),
            price_eur_mwh=100.0,
            provider="energy-charts",
            source_name="test",
        ),
        PricePoint(
            timestamp_utc=datetime(2026, 7, 1, 10, 15, tzinfo=UTC),
            timestamp_brussels=datetime(2026, 7, 1, 12, 15, tzinfo=BRUSSELS),
            price_eur_mwh=90.0,
            provider="energy-charts",
            source_name="test",
        ),
    ]

    freshness = build_energy_charts_freshness(prices, fetched_at_utc=fetched_at, expires_at_utc=None, cached=True)

    assert freshness.display_name == "Energy-Charts BE day-ahead price"
    assert freshness.source_url is not None
    assert freshness.latest_timestamp_utc is not None
    assert freshness.latest_timestamp_utc.isoformat() == "2026-07-01T10:15:00+00:00"
    assert freshness.latest_timestamp_brussels is not None
    assert freshness.latest_timestamp_brussels.isoformat() == "2026-07-01T12:15:00+02:00"
