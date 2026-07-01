from __future__ import annotations

import hashlib
import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


class FileCache:
    def __init__(self, cache_dir: Path | None = None, ttl_seconds: int = 300) -> None:
        configured_cache_dir = os.getenv("STROOMMOMENT_CACHE_DIR")
        self.cache_dir = cache_dir or (Path(configured_cache_dir) if configured_cache_dir else Path(__file__).resolve().parents[2] / ".cache")
        self.ttl = timedelta(seconds=ttl_seconds)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path_for_key(self, key: str) -> Path:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return self.cache_dir / f"{digest}.json"

    def get(self, key: str) -> tuple[dict[str, Any] | None, datetime | None, datetime | None]:
        path = self._path_for_key(key)
        if not path.exists():
            return None, None, None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            fetched_at = datetime.fromisoformat(payload["fetched_at_utc"])
            expires_at = datetime.fromisoformat(payload["expires_at_utc"])
            if datetime.now(UTC) >= expires_at:
                return None, fetched_at, expires_at
            return payload["data"], fetched_at, expires_at
        except (OSError, KeyError, ValueError, json.JSONDecodeError):
            return None, None, None

    def set(self, key: str, data: dict[str, Any]) -> tuple[datetime, datetime]:
        fetched_at = datetime.now(UTC)
        expires_at = fetched_at + self.ttl
        payload = {
            "fetched_at_utc": fetched_at.isoformat(),
            "expires_at_utc": expires_at.isoformat(),
            "data": data,
        }
        self._path_for_key(key).write_text(json.dumps(payload), encoding="utf-8")
        return fetched_at, expires_at
