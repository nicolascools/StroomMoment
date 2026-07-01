from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from zoneinfo import ZoneInfo

from app.models import ForecastPoint, PricePoint

BRUSSELS = ZoneInfo("Europe/Brussels")


def parse_elia_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def aggregate_wind_by_timestamp(records: list[dict[str, Any]]) -> dict[datetime, dict[str, float | None]]:
    aggregated: dict[datetime, dict[str, float | None]] = {}
    for record in records:
        timestamp = parse_elia_datetime(record["datetime"])
        if "wind_forecast_mw" in record:
            aggregated[timestamp] = {
                "wind_forecast_mw": as_float(record.get("wind_forecast_mw")),
                "wind_realtime_mw": as_float(record.get("wind_realtime_mw")),
            }
            continue

        current = aggregated.setdefault(timestamp, {"wind_forecast_mw": 0.0, "wind_realtime_mw": 0.0})
        current["wind_forecast_mw"] = (current["wind_forecast_mw"] or 0.0) + (as_float(record.get("mostrecentforecast")) or 0.0)
        realtime = as_float(record.get("realtime"))
        if realtime is not None:
            current["wind_realtime_mw"] = (current["wind_realtime_mw"] or 0.0) + realtime
    return aggregated


def normalize_forecast_points(
    load_records: list[dict[str, Any]],
    pv_records: list[dict[str, Any]],
    wind_records: list[dict[str, Any]],
) -> list[ForecastPoint]:
    by_timestamp: dict[datetime, dict[str, float | None]] = {}

    for record in load_records:
        timestamp = parse_elia_datetime(record["datetime"])
        by_timestamp.setdefault(timestamp, {})
        by_timestamp[timestamp]["load_forecast_mw"] = as_float(record.get("mostrecentforecast"))
        by_timestamp[timestamp]["load_measured_mw"] = as_float(record.get("measured"))

    for record in pv_records:
        timestamp = parse_elia_datetime(record["datetime"])
        by_timestamp.setdefault(timestamp, {})
        by_timestamp[timestamp]["pv_forecast_mw"] = as_float(record.get("mostrecentforecast"))
        by_timestamp[timestamp]["pv_realtime_mw"] = as_float(record.get("realtime"))

    wind_by_timestamp = aggregate_wind_by_timestamp(wind_records)
    for timestamp, values in wind_by_timestamp.items():
        by_timestamp.setdefault(timestamp, {})
        by_timestamp[timestamp]["wind_forecast_mw"] = values.get("wind_forecast_mw")
        by_timestamp[timestamp]["wind_realtime_mw"] = values.get("wind_realtime_mw")

    points: list[ForecastPoint] = []
    for timestamp in sorted(by_timestamp):
        values = by_timestamp[timestamp]
        pv = values.get("pv_forecast_mw")
        wind = values.get("wind_forecast_mw")
        load = values.get("load_forecast_mw")
        renewable = (pv or 0.0) + (wind or 0.0) if pv is not None or wind is not None else None
        renewable_share = renewable / load if renewable is not None and load and load > 0 else None
        points.append(
            ForecastPoint(
                timestamp_utc=timestamp,
                timestamp_brussels=timestamp.astimezone(BRUSSELS),
                load_forecast_mw=load,
                load_measured_mw=values.get("load_measured_mw"),
                pv_forecast_mw=pv,
                pv_realtime_mw=values.get("pv_realtime_mw"),
                wind_forecast_mw=wind,
                wind_realtime_mw=values.get("wind_realtime_mw"),
                renewable_forecast_mw=renewable,
                renewable_share_of_load=renewable_share,
            )
        )
    return points


def floor_to_hour(timestamp: datetime) -> datetime:
    return timestamp.replace(minute=0, second=0, microsecond=0)


def attach_prices_to_points(points: list[ForecastPoint], prices: list[PricePoint]) -> list[ForecastPoint]:
    price_by_exact = {price.timestamp_utc: price for price in prices}
    price_by_hour = {floor_to_hour(price.timestamp_utc): price for price in prices if price.timestamp_utc.minute == 0}
    enriched: list[ForecastPoint] = []
    for point in points:
        price = price_by_exact.get(point.timestamp_utc) or price_by_hour.get(floor_to_hour(point.timestamp_utc))
        if price is None:
            enriched.append(point)
            continue
        enriched.append(
            point.model_copy(
                update={
                    "price_eur_mwh": price.price_eur_mwh,
                    "price_provider": price.provider,
                }
            )
        )
    return add_price_scores(enriched)


def add_price_scores(points: list[ForecastPoint]) -> list[ForecastPoint]:
    prices = [point.price_eur_mwh for point in points if point.price_eur_mwh is not None]
    if not prices:
        return points
    minimum = min(prices)
    maximum = max(prices)
    scored: list[ForecastPoint] = []
    for point in points:
        if point.price_eur_mwh is None:
            scored.append(point)
        elif maximum <= minimum:
            scored.append(point.model_copy(update={"price_score": 0.5}))
        else:
            score = 1.0 - ((point.price_eur_mwh - minimum) / (maximum - minimum))
            scored.append(point.model_copy(update={"price_score": max(0.0, min(1.0, score))}))
    return scored
