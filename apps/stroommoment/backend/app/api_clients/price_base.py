from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Protocol

from app.models import PricePoint, SourceFreshness


@dataclass(frozen=True)
class PriceResponse:
    prices: list[PricePoint]
    freshness: SourceFreshness


class PriceProvider(Protocol):
    async def fetch_prices(self, start_date: date, end_date: date) -> PriceResponse:
        """Fetch normalized price points for local Belgian calendar dates."""
