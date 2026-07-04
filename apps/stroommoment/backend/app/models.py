from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SourceFreshness(BaseModel):
    source: str
    display_name: str | None = None
    source_url: str | None = None
    fetched_at_utc: datetime | None = None
    expires_at_utc: datetime | None = None
    latest_timestamp_utc: datetime | None = None
    latest_timestamp_brussels: datetime | None = None
    cached: bool = False
    record_count: int = 0
    error: str | None = None


class PricePoint(BaseModel):
    timestamp_utc: datetime
    timestamp_brussels: datetime
    price_eur_mwh: float
    provider: str
    source_name: str
    fetched_at_utc: datetime | None = None


class ApplianceProfile(BaseModel):
    id: str
    label: str
    default_duration_minutes: int
    default_power_kw: float | None = None
    power_options_kw: list[float] | None = None
    peak_relevance: str
    short_description: str
    peak_explanation: str


class ApplianceImpact(BaseModel):
    appliance_id: str
    label: str
    assumed_power_kw: float | None = None
    estimated_energy_kwh: float | None = None
    peak_relevance: str
    peak_note: str
    capacity_tariff_note: str


class ForecastPoint(BaseModel):
    timestamp_utc: datetime
    timestamp_brussels: datetime
    load_forecast_mw: float | None = None
    load_measured_mw: float | None = None
    pv_forecast_mw: float | None = None
    pv_realtime_mw: float | None = None
    wind_forecast_mw: float | None = None
    wind_realtime_mw: float | None = None
    renewable_forecast_mw: float | None = None
    renewable_share_of_load: float | None = None
    price_eur_mwh: float | None = None
    price_score: float | None = None
    price_provider: str | None = None


class SignalSnapshot(BaseModel):
    generated_at_utc: datetime
    generated_at_brussels: datetime
    points: list[ForecastPoint]
    freshness: list[SourceFreshness]


class ScoreBreakdown(BaseModel):
    total: float = Field(ge=0, le=1)
    renewable_score: float = Field(ge=0, le=1)
    low_load_score: float = Field(ge=0, le=1)
    convenience_score: float = Field(ge=0, le=1)
    price_score: float | None = Field(default=None, ge=0, le=1)
    weights: dict[str, float]


class CandidateWindow(BaseModel):
    start_utc: datetime
    end_utc: datetime
    start_brussels: datetime
    end_brussels: datetime
    score: ScoreBreakdown
    average_load_mw: float | None = None
    average_renewable_mw: float | None = None
    average_renewable_share_of_load: float | None = None
    average_price_eur_mwh: float | None = None
    price_provider: str | None = None
    explanations: list[str]


class Recommendation(BaseModel):
    duration_minutes: int
    deadline_brussels: datetime
    mode: str
    appliance: ApplianceProfile | None = None
    appliance_impact: ApplianceImpact | None = None
    best_window: CandidateWindow | None
    top_windows: list[CandidateWindow]
    avoid_windows: list[CandidateWindow] = Field(default_factory=list)
    freshness: list[SourceFreshness]
    warnings: list[str] = Field(default_factory=list)
