from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import ApplianceProfile
from app.scoring.appliances import list_appliance_profiles, resolve_appliance_request
from app.services.signals import SignalService
from app.scoring.windows import build_recommendation

BRUSSELS = ZoneInfo("Europe/Brussels")

app = FastAPI(title="StroomMoment API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    except Exception as exc:  # pragma: no cover - final API safety net
        raise HTTPException(status_code=502, detail=f"Unable to fetch Elia data: {exc}") from exc
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
    except Exception as exc:  # pragma: no cover - final API safety net
        raise HTTPException(status_code=502, detail=f"Unable to fetch Elia data: {exc}") from exc

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
