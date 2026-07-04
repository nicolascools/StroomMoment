from __future__ import annotations

from typing import Any

import httpx
import pytest

from app.api_clients.elia import EliaClient, FAILURE_TTL_SECONDS
from app.services.cache import FileCache


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def make_client(tmp_path) -> EliaClient:
    return EliaClient(cache=FileCache(cache_dir=tmp_path, ttl_seconds=300))


@pytest.mark.anyio
async def test_fetch_records_paginates_until_short_page(tmp_path) -> None:
    client = make_client(tmp_path)
    offsets: list[int] = []

    async def fake_fetch_page(dataset_id: str, params: dict[str, Any]):
        offsets.append(params["offset"])
        count = 100 if params["offset"] == 0 else 40
        records = [{"datetime": "2026-07-01T10:00:00+00:00"} for _ in range(count)]
        return {"results": records}, False, None, None

    client._fetch_page = fake_fetch_page  # type: ignore[method-assign]

    response = await client.fetch_records("ods002", {"order_by": "datetime"}, "elia:test:load", "Test load", max_records=300)

    assert offsets == [0, 100]
    assert response.freshness.record_count == 140
    assert response.freshness.error is None


@pytest.mark.anyio
async def test_elia_failure_is_negative_cached_and_sanitized(tmp_path) -> None:
    client = make_client(tmp_path)
    calls = {"count": 0}

    async def failing_fetch_page(dataset_id: str, params: dict[str, Any]):
        calls["count"] += 1
        raise httpx.ConnectError("secret-internal-host boom")

    client._fetch_page = failing_fetch_page  # type: ignore[method-assign]

    first = await client.fetch_records("ods002", {}, "elia:test:load", "Test load", max_records=100)
    second = await client.fetch_records("ods002", {}, "elia:test:load", "Test load", max_records=100)

    # The second request must be served from the failure cache without a new upstream attempt.
    assert calls["count"] == 1
    assert first.records == []
    assert first.freshness.error is not None
    assert "secret-internal-host" not in first.freshness.error
    assert "ConnectError" in first.freshness.error
    assert second.freshness.cached is True
    assert second.freshness.error is not None


@pytest.mark.anyio
async def test_elia_failure_cache_expires(tmp_path) -> None:
    client = make_client(tmp_path)
    calls = {"count": 0}

    async def failing_fetch_page(dataset_id: str, params: dict[str, Any]):
        calls["count"] += 1
        raise httpx.ReadTimeout("slow upstream")

    client._fetch_page = failing_fetch_page  # type: ignore[method-assign]

    await client.fetch_records("ods002", {}, "elia:test:load", "Test load", max_records=100)

    # Expire the failure marker by rewriting it with a zero TTL.
    client.cache.set("elia:failure:ods002", {"error": "expired"}, ttl_seconds=0)

    await client.fetch_records("ods002", {}, "elia:test:load", "Test load", max_records=100)

    assert calls["count"] == 2
    assert FAILURE_TTL_SECONDS > 0
