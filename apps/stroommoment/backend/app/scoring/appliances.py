from __future__ import annotations

from dataclasses import dataclass

from app.models import ApplianceImpact, ApplianceProfile

CAPACITY_TARIFF_NOTE = (
    "Without live meter/P1 data, StroomMoment cannot know whether this creates a new monthly "
    "15-minute peak. As a rule of thumb, avoid combining higher-power loads with cooking, EV charging, "
    "boilers, dryers, or other large appliances."
)

APPLIANCE_PROFILES: tuple[ApplianceProfile, ...] = (
    ApplianceProfile(
        id="dishwasher",
        label="Dishwasher",
        default_duration_minutes=120,
        default_power_kw=1.2,
        peak_relevance="medium",
        short_description="Moderate flexible load; often easy to shift.",
        peak_explanation="Usually not the biggest peak driver, but still worth avoiding overlap with other high-power appliances.",
    ),
    ApplianceProfile(
        id="washing_machine",
        label="Washing machine",
        default_duration_minutes=90,
        default_power_kw=1.0,
        peak_relevance="low/medium",
        short_description="Flexible load; actual consumption depends heavily on temperature and program.",
        peak_explanation="Usually easier to shift, but hot programs can draw more power than cold or eco programs.",
    ),
    ApplianceProfile(
        id="dryer",
        label="Dryer",
        default_duration_minutes=90,
        default_power_kw=2.2,
        peak_relevance="high",
        short_description="Relatively high power; avoid stacking with cooking, EV charging, boiler, etc.",
        peak_explanation="A dryer can materially contribute to the 15-minute peak if it overlaps with other high-power loads.",
    ),
    ApplianceProfile(
        id="ev_charging",
        label="EV charging",
        default_duration_minutes=240,
        default_power_kw=7.4,
        power_options_kw=[3.7, 7.4, 11.0],
        peak_relevance="very high",
        short_description="Very flexible but can dominate kwartierpiek/capacity tariff.",
        peak_explanation="EV charging can dominate a household's 15-minute peak, especially at 7.4 kW or 11 kW.",
    ),
    ApplianceProfile(
        id="boiler",
        label="Boiler",
        default_duration_minutes=120,
        default_power_kw=2.0,
        peak_relevance="high",
        short_description="High but often schedulable load.",
        peak_explanation="A boiler is often schedulable, but it can meaningfully raise the peak if combined with other large loads.",
    ),
    ApplianceProfile(
        id="heat_pump",
        label="Heat pump",
        default_duration_minutes=180,
        default_power_kw=1.5,
        peak_relevance="medium/high",
        short_description="Flexible only within comfort limits; avoid simplistic advice.",
        peak_explanation="Heat pumps can run for long periods. Shift gently and avoid reducing comfort or forcing inefficient catch-up heating.",
    ),
    ApplianceProfile(
        id="custom",
        label="Custom",
        default_duration_minutes=120,
        default_power_kw=None,
        peak_relevance="unknown",
        short_description="Custom flexible load with user-provided duration and optional power.",
        peak_explanation="Peak impact depends on the actual appliance power and what else is running at the same time.",
    ),
)

APPLIANCE_BY_ID = {profile.id: profile for profile in APPLIANCE_PROFILES}


@dataclass(frozen=True)
class ResolvedApplianceRequest:
    duration_minutes: int
    power_kw: float | None
    profile: ApplianceProfile | None
    impact: ApplianceImpact | None


def list_appliance_profiles() -> list[ApplianceProfile]:
    return list(APPLIANCE_PROFILES)


def get_appliance_profile(appliance_id: str | None) -> ApplianceProfile | None:
    if appliance_id is None:
        return None
    return APPLIANCE_BY_ID.get(appliance_id)


def build_appliance_impact(profile: ApplianceProfile, duration_minutes: int, power_kw: float | None) -> ApplianceImpact:
    estimated_energy_kwh = None
    if power_kw is not None:
        estimated_energy_kwh = round(power_kw * (duration_minutes / 60), 3)
    return ApplianceImpact(
        appliance_id=profile.id,
        label=profile.label,
        assumed_power_kw=power_kw,
        estimated_energy_kwh=estimated_energy_kwh,
        peak_relevance=profile.peak_relevance,
        peak_note=profile.peak_explanation,
        capacity_tariff_note=CAPACITY_TARIFF_NOTE,
    )


def resolve_appliance_request(
    appliance_id: str | None,
    duration_minutes: int | None,
    power_kw: float | None,
    fallback_duration_minutes: int = 120,
) -> ResolvedApplianceRequest:
    profile = get_appliance_profile(appliance_id)
    if profile:
        resolved_duration = duration_minutes or profile.default_duration_minutes
        resolved_power = power_kw if power_kw is not None else profile.default_power_kw
    else:
        resolved_duration = duration_minutes or fallback_duration_minutes
        resolved_power = None
    impact = build_appliance_impact(profile, resolved_duration, resolved_power) if profile else None
    return ResolvedApplianceRequest(
        duration_minutes=resolved_duration,
        power_kw=resolved_power,
        profile=profile,
        impact=impact,
    )


def appliance_explanation(impact: ApplianceImpact | None) -> str | None:
    if impact is None:
        return None
    relevance = impact.peak_relevance.lower()
    if relevance in {"high", "very high", "medium/high"}:
        return "High-power appliance: avoid stacking with other large loads"
    if relevance in {"medium", "low/medium"}:
        return "Flexible load with moderate peak impact"
    return "Peak impact depends on the appliance power you entered"
