from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.api_clients.elia import EliaClient
from app.api_clients.energy_charts import EnergyChartsClient
from app.api_clients.price_base import PriceProvider
from app.models import SignalSnapshot
from app.services.normalization import attach_prices_to_points, normalize_forecast_points

BRUSSELS = ZoneInfo("Europe/Brussels")


class SignalService:
    def __init__(self, elia_client: EliaClient | None = None, price_provider: PriceProvider | None = None) -> None:
        self.elia = elia_client or EliaClient()
        self.price_provider = price_provider or EnergyChartsClient()

    async def get_signals(self, hours: int = 48) -> SignalSnapshot:
        load_response, pv_response, wind_response = await asyncio.gather(
            self.elia.fetch_load(),
            self.elia.fetch_pv(),
            self.elia.fetch_wind(),
        )
        points = normalize_forecast_points(load_response.records, pv_response.records, wind_response.records)
        now = datetime.now(UTC)
        end = now + timedelta(hours=hours)
        upcoming_points = [point for point in points if now <= point.timestamp_utc <= end]
        if not upcoming_points:
            upcoming_points = points[: min(len(points), hours * 4)]
        freshness = [load_response.freshness, pv_response.freshness, wind_response.freshness]

        if upcoming_points:
            start_date = upcoming_points[0].timestamp_brussels.date()
            end_date = upcoming_points[-1].timestamp_brussels.date()
            price_response = await self.price_provider.fetch_prices(start_date, end_date)
            upcoming_points = attach_prices_to_points(upcoming_points, price_response.prices)
            freshness.append(price_response.freshness)

        return SignalSnapshot(
            generated_at_utc=now,
            generated_at_brussels=now.astimezone(BRUSSELS),
            points=upcoming_points,
            freshness=freshness,
        )
