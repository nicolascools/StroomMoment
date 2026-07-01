from __future__ import annotations

from datetime import UTC

from app.api_clients.elia import latest_record_timestamp
from app.services.normalization import aggregate_wind_by_timestamp, normalize_forecast_points, parse_elia_datetime


def test_parse_elia_datetime_keeps_utc_and_brussels_conversion() -> None:
    parsed = parse_elia_datetime("2026-07-01T12:45:00+00:00")

    assert parsed.tzinfo == UTC
    assert parsed.isoformat() == "2026-07-01T12:45:00+00:00"


def test_aggregate_wind_by_timestamp_sums_raw_wind_rows() -> None:
    records = [
        {"datetime": "2026-07-01T12:45:00+00:00", "mostrecentforecast": 10.0, "realtime": 8.0},
        {"datetime": "2026-07-01T12:45:00+00:00", "mostrecentforecast": 15.5, "realtime": 6.0},
    ]

    aggregated = aggregate_wind_by_timestamp(records)
    values = aggregated[parse_elia_datetime("2026-07-01T12:45:00+00:00")]

    assert values["wind_forecast_mw"] == 25.5
    assert values["wind_realtime_mw"] == 14.0


def test_normalize_forecast_points_aligns_load_pv_and_wind() -> None:
    load = [{"datetime": "2026-07-01T12:45:00+00:00", "mostrecentforecast": 1000, "measured": 990}]
    pv = [{"datetime": "2026-07-01T12:45:00+00:00", "mostrecentforecast": 200, "realtime": 190}]
    wind = [{"datetime": "2026-07-01T12:45:00+00:00", "wind_forecast_mw": 100, "wind_realtime_mw": 80}]

    points = normalize_forecast_points(load, pv, wind)

    assert len(points) == 1
    assert points[0].load_forecast_mw == 1000
    assert points[0].pv_forecast_mw == 200
    assert points[0].wind_forecast_mw == 100
    assert points[0].renewable_forecast_mw == 300
    assert points[0].renewable_share_of_load == 0.3
    assert points[0].timestamp_brussels.isoformat() == "2026-07-01T14:45:00+02:00"


def test_latest_record_timestamp_uses_latest_elia_datetime() -> None:
    records = [
        {"datetime": "2026-07-01T12:45:00+00:00"},
        {"datetime": "2026-07-01T13:15:00+00:00"},
        {"datetime": None},
    ]

    latest = latest_record_timestamp(records)

    assert latest is not None
    assert latest.isoformat() == "2026-07-01T13:15:00+00:00"
