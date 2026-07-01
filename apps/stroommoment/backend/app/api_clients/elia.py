from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import httpx

from app.models import SourceFreshness
from app.services.cache import FileCache

BASE_URL = "https://opendata.elia.be/api/explore/v2.1/catalog/datasets"
BRUSSELS = ZoneInfo("Europe/Brussels")

ELIA_DATASET_URLS = {
    "ods002": "https://opendata.elia.be/explore/dataset/ods002/",
    "ods087": "https://opendata.elia.be/explore/dataset/ods087/",
    "ods086": "https://opendata.elia.be/explore/dataset/ods086/",
}


def parse_record_timestamp(record: dict[str, Any]) -> datetime | None:
    raw_timestamp = record.get("datetime")
    if not raw_timestamp:
        return None
    try:
        parsed = datetime.fromisoformat(str(raw_timestamp).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def latest_record_timestamp(records: list[dict[str, Any]]) -> datetime | None:
    timestamps = [timestamp for record in records if (timestamp := parse_record_timestamp(record)) is not None]
    return max(timestamps) if timestamps else None


@dataclass(frozen=True)
class EliaResponse:
    records: list[dict[str, Any]]
    freshness: SourceFreshness


class EliaClient:
    def __init__(self, cache: FileCache | None = None, timeout_seconds: float = 20.0) -> None:
        self.cache = cache or FileCache(ttl_seconds=300)
        self.timeout_seconds = timeout_seconds

    async def _fetch_page(self, dataset_id: str, params: dict[str, Any]) -> tuple[dict[str, Any], bool, Any, Any]:
        query = urlencode(params, doseq=True, safe=",()")
        url = f"{BASE_URL}/{dataset_id}/records?{query}"
        cached_data, fetched_at, expires_at = self.cache.get(url)
        if cached_data is not None:
            return cached_data, True, fetched_at, expires_at

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        fetched_at, expires_at = self.cache.set(url, data)
        return data, False, fetched_at, expires_at

    async def fetch_records(
        self,
        dataset_id: str,
        params: dict[str, Any],
        source_label: str,
        display_name: str,
        max_records: int = 500,
    ) -> EliaResponse:
        records: list[dict[str, Any]] = []
        fetched_values = []
        expiry_values = []
        all_cached = True

        try:
            for offset in range(0, max_records, 100):
                page_params = dict(params)
                page_params["limit"] = min(100, max_records - offset)
                page_params["offset"] = offset
                data, cached, fetched_at, expires_at = await self._fetch_page(dataset_id, page_params)
                all_cached = all_cached and cached
                if fetched_at is not None:
                    fetched_values.append(fetched_at)
                if expires_at is not None:
                    expiry_values.append(expires_at)
                page_records = data.get("results", [])
                records.extend(page_records)
                if len(page_records) < page_params["limit"]:
                    break
        except httpx.HTTPError as exc:
            return EliaResponse(
                records=[],
                freshness=SourceFreshness(
                    source=source_label,
                    display_name=display_name,
                    source_url=ELIA_DATASET_URLS.get(dataset_id),
                    error=str(exc),
                ),
            )

        latest_timestamp = latest_record_timestamp(records)

        return EliaResponse(
            records=records,
            freshness=SourceFreshness(
                source=source_label,
                display_name=display_name,
                source_url=ELIA_DATASET_URLS.get(dataset_id),
                fetched_at_utc=min(fetched_values) if fetched_values else None,
                expires_at_utc=min(expiry_values) if expiry_values else None,
                latest_timestamp_utc=latest_timestamp,
                latest_timestamp_brussels=latest_timestamp.astimezone(BRUSSELS) if latest_timestamp else None,
                cached=all_cached,
                record_count=len(records),
            ),
        )

    async def fetch_load(self) -> EliaResponse:
        return await self.fetch_records(
            "ods002",
            {
                "select": "datetime,resolutioncode,measured,mostrecentforecast,dayaheadforecast,weekaheadforecast",
                "order_by": "datetime",
            },
            "elia:ods002:load",
            "Elia Open Data load forecast",
            max_records=500,
        )

    async def fetch_pv(self) -> EliaResponse:
        return await self.fetch_records(
            "ods087",
            {
                "select": "datetime,resolutioncode,region,realtime,mostrecentforecast,dayaheadforecast,weekaheadforecast",
                "where": 'region="Belgium"',
                "order_by": "datetime",
            },
            "elia:ods087:pv",
            "Elia Open Data PV forecast",
            max_records=800,
        )

    async def fetch_wind(self) -> EliaResponse:
        return await self.fetch_records(
            "ods086",
            {
                "select": "datetime,sum(realtime) as wind_realtime_mw,sum(mostrecentforecast) as wind_forecast_mw,sum(dayaheadforecast) as wind_dayahead_mw,sum(weekaheadforecast) as wind_weekahead_mw",
                "group_by": "datetime",
                "order_by": "datetime",
            },
            "elia:ods086:wind",
            "Elia Open Data wind forecast",
            max_records=800,
        )
