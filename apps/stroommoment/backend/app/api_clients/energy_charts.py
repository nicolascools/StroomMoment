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
                return [], SourceFreshness(
                    source="energy-charts:price:BE",
                    fetched_at_utc=fetched_at,
                    expires_at_utc=expires_at,
                    cached=True,
                    record_count=0,
                    error=str(cached_data["_missing_error"]),
                ), True
            points = parse_energy_charts_prices(cached_data, fetched_at_utc=fetched_at)
            return points, SourceFreshness(
                source="energy-charts:price:BE",
                fetched_at_utc=fetched_at,
                expires_at_utc=expires_at,
                cached=True,
                record_count=len(points),
            ), True

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(url)
                if response.status_code == 404:
                    fetched_at, expires_at = self.cache.set(url, {"_missing_error": f"Price data unavailable for {day.isoformat()}"})
                    return [], SourceFreshness(
                        source="energy-charts:price:BE",
                        fetched_at_utc=fetched_at,
                        expires_at_utc=expires_at,
                        error=f"Price data unavailable for {day.isoformat()}",
                    ), False
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            return [], SourceFreshness(source="energy-charts:price:BE", error=str(exc)), False

        fetched_at, expires_at = self.cache.set(url, data)
        points = parse_energy_charts_prices(data, fetched_at_utc=fetched_at)
        return points, SourceFreshness(
            source="energy-charts:price:BE",
            fetched_at_utc=fetched_at,
            expires_at_utc=expires_at,
            cached=False,
            record_count=len(points),
        ), False

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
            freshness=SourceFreshness(
                source="energy-charts:price:BE",
                fetched_at_utc=min(fetched_values) if fetched_values else None,
                expires_at_utc=min(expiry_values) if expiry_values else None,
                cached=cached,
                record_count=len(prices),
                error=error,
            ),
        )
