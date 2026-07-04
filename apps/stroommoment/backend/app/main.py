from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import ApplianceProfile
from app.scoring.appliances import list_appliance_profiles, resolve_appliance_request
from app.services.signals import SignalService
from app.scoring.windows import build_recommendation

BRUSSELS = ZoneInfo("Europe/Brussels")
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,https://poc.coolsnet.com"
UPSTREAM_ERROR_DETAIL = "Upstream energy data is temporarily unavailable. Please try again shortly."

logger = logging.getLogger("stroommoment.api")


def cors_origins() -> list[str]:
    raw = os.getenv("STROOMMOMENT_CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

app = FastAPI(title="StroomMoment API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

signal_service = SignalService()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/signals")
async def get_signals(hours: int = Query(default=48, ge=1, le=168)) -> dict:
    try:
        snapshot = await signal_service.get_signals(hours=hours)
    except Exception:
        logger.exception("Failed to build signal snapshot")
        raise HTTPException(status_code=502, detail=UPSTREAM_ERROR_DETAIL)
    return snapshot.model_dump(mode="json")


@app.get("/api/appliances")
async def get_appliances() -> list[ApplianceProfile]:
    return list_appliance_profiles()


@app.get("/api/recommendations")
async def get_recommendations(
    duration_minutes: int | None = Query(default=None, ge=15, le=24 * 60),
    deadline: datetime | None = None,
    mode: str = Query(default="balanced", pattern="^(balanced|renewable|low_load|cheapest)$"),
    appliance_id: str | None = Query(default=None),
    power_kw: float | None = Query(default=None, gt=0, le=22),
) -> dict:
    resolved_appliance = resolve_appliance_request(appliance_id, duration_minutes, power_kw)
    if appliance_id is not None and resolved_appliance.profile is None:
        raise HTTPException(status_code=404, detail=f"Unknown appliance_id: {appliance_id}")

    if deadline is None:
        tomorrow = datetime.now(BRUSSELS).date() + timedelta(days=1)
        deadline = datetime.combine(tomorrow, datetime.min.time(), tzinfo=BRUSSELS).replace(hour=7)
    elif deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=BRUSSELS)

    try:
        snapshot = await signal_service.get_signals(hours=72)
    except Exception:
        logger.exception("Failed to build signal snapshot for recommendation")
        raise HTTPException(status_code=502, detail=UPSTREAM_ERROR_DETAIL)

    recommendation = build_recommendation(
        points=snapshot.points,
        duration_minutes=resolved_appliance.duration_minutes,
        deadline=deadline,
        mode=mode,
        freshness=snapshot.freshness,
        appliance=resolved_appliance.profile,
        appliance_impact=resolved_appliance.impact,
    )
    return recommendation.model_dump(mode="json")
