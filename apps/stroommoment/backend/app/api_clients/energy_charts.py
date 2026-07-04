from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Any
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import httpx

from app.api_clients.price_base import PriceResponse
from app.models import PricePoint, SourceFreshness
from app.services.cache import FileCache

BRUSSELS = ZoneInfo("Europe/Brussels")
BASE_URL = "https://api.energy-charts.info/price"
SOURCE = "energy-charts:price:BE"
DISPLAY_NAME = "Energy-Charts BE day-ahead price"
SOURCE_URL = "https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE"


def parse_energy_charts_prices(
    payload: dict[str, Any],
    fetched_at_utc: datetime | None = None,
    provider: str = "energy-charts",
    source_name: str = "Energy-Charts day-ahead price BE",
) -> list[PricePoint]:
    timestamps = payload.get("unix_seconds") or []
    prices = payload.get("price") or []
    points: list[PricePoint] = []
    for unix_seconds, price in zip(timestamps, prices):
        if price is None:
            continue
        timestamp_utc = datetime.fromtimestamp(int(unix_seconds), tz=UTC)
        points.append(
            PricePoint(
                timestamp_utc=timestamp_utc,
                timestamp_brussels=timestamp_utc.astimezone(BRUSSELS),
                price_eur_mwh=float(price),
                provider=provider,
                source_name=source_name,
                fetched_at_utc=fetched_at_utc,
            )
        )
    return points


def latest_price_timestamp(prices: list[PricePoint]) -> datetime | None:
    timestamps = [price.timestamp_utc for price in prices]
    return max(timestamps) if timestamps else None


def build_energy_charts_freshness(
    prices: list[PricePoint],
    fetched_at_utc: datetime | None,
    expires_at_utc: datetime | None,
    cached: bool = False,
    error: str | None = None,
) -> SourceFreshness:
    latest_timestamp = latest_price_timestamp(prices)
    return SourceFreshness(
        source=SOURCE,
        display_name=DISPLAY_NAME,
        source_url=SOURCE_URL,
        fetched_at_utc=fetched_at_utc,
        expires_at_utc=expires_at_utc,
        latest_timestamp_utc=latest_timestamp,
        latest_timestamp_brussels=latest_timestamp.astimezone(BRUSSELS) if latest_timestamp else None,
        cached=cached,
        record_count=len(prices),
        error=error,
    )


class EnergyChartsClient:
    def __init__(self, cache: FileCache | None = None, timeout_seconds: float = 20.0) -> None:
        self.cache = cache or FileCache(ttl_seconds=15 * 60)
        self.timeout_seconds = timeout_seconds

    async def _fetch_day(self, day: date) -> tuple[list[PricePoint], SourceFreshness, bool]:
        params = {"bzn": "BE", "start": day.isoformat(), "end": day.isoformat()}
        url = f"{BASE_URL}?{urlencode(params)}"
        cached_data, fetched_at, expires_at = self.cache.get(url)
        if cached_data is not None:
            if cached_data.get("_missing_error"):
                return [], build_energy_charts_freshness([], fetched_at, expires_at, cached=True, error=str(cached_data["_missing_error"])), True
            points = parse_energy_charts_prices(cached_data, fetched_at_utc=fetched_at)
            return points, build_energy_charts_freshness(points, fetched_at, expires_at, cached=True), True

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(url)
                if response.status_code == 404:
                    fetched_at, expires_at = self.cache.set(url, {"_missing_error": f"Price data unavailable for {day.isoformat()}"})
                    return [], build_energy_charts_freshness([], fetched_at, expires_at, error=f"Price data unavailable for {day.isoformat()}"), False
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            return [], build_energy_charts_freshness([], None, None, error=f"Price request failed ({type(exc).__name__})."), False

        fetched_at, expires_at = self.cache.set(url, data)
        points = parse_energy_charts_prices(data, fetched_at_utc=fetched_at)
        return points, build_energy_charts_freshness(points, fetched_at, expires_at), False

    async def fetch_prices(self, start_date: date, end_date: date) -> PriceResponse:
        prices: list[PricePoint] = []
        freshness_items: list[SourceFreshness] = []
        day = start_date
        while day <= end_date:
            day_prices, freshness, _cached = await self._fetch_day(day)
            prices.extend(day_prices)
            freshness_items.append(freshness)
            day += timedelta(days=1)

        fetched_values = [item.fetched_at_utc for item in freshness_items if item.fetched_at_utc is not None]
        expiry_values = [item.expires_at_utc for item in freshness_items if item.expires_at_utc is not None]
        errors = [item.error for item in freshness_items if item.error]
        cached = bool(freshness_items) and all(item.cached for item in freshness_items if item.error is None)
        error = None if prices else "; ".join(errors) if errors else None

        return PriceResponse(
            prices=sorted(prices, key=lambda point: point.timestamp_utc),
            freshness=build_energy_charts_freshness(
                prices,
                min(fetched_values) if fetched_values else None,
                min(expiry_values) if expiry_values else None,
                cached=cached,
                error=error,
            ),
        )
