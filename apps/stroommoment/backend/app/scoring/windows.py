from __future__ import annotations

from datetime import UTC, datetime, timedelta
from math import ceil
from statistics import mean
from zoneinfo import ZoneInfo

from app.models import ApplianceImpact, ApplianceProfile, CandidateWindow, ForecastPoint, Recommendation, ScoreBreakdown, SourceFreshness
from app.scoring.appliances import appliance_explanation
from app.scoring.weights import weights_for_mode

BRUSSELS = ZoneInfo("Europe/Brussels")


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def average(values: list[float | None]) -> float | None:
    usable = [value for value in values if value is not None]
    if not usable:
        return None
    return mean(usable)


def min_max_score(value: float | None, minimum: float | None, maximum: float | None, invert: bool = False) -> float:
    if value is None or minimum is None or maximum is None or maximum <= minimum:
        return 0.5
    score = (value - minimum) / (maximum - minimum)
    if invert:
        score = 1.0 - score
    return clamp(score)


def generate_candidate_windows(points: list[ForecastPoint], duration_minutes: int, deadline: datetime) -> list[list[ForecastPoint]]:
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=BRUSSELS)
    deadline_utc = deadline.astimezone(UTC)
    steps = max(1, ceil(duration_minutes / 15))
    sorted_points = sorted(points, key=lambda point: point.timestamp_utc)
    windows: list[list[ForecastPoint]] = []
    for index in range(0, len(sorted_points) - steps + 1):
        window = sorted_points[index : index + steps]
        expected_end = window[0].timestamp_utc + timedelta(minutes=duration_minutes)
        if expected_end > deadline_utc:
            continue
        if window[-1].timestamp_utc - window[0].timestamp_utc != timedelta(minutes=15 * (steps - 1)):
            continue
        windows.append(window)
    return windows


def score_window(
    window: list[ForecastPoint],
    all_windows: list[list[ForecastPoint]],
    deadline: datetime,
    mode: str,
    appliance_impact: ApplianceImpact | None = None,
) -> CandidateWindow:
    avg_renewable = average([point.renewable_forecast_mw for point in window])
    avg_load = average([point.load_forecast_mw for point in window])
    avg_share = average([point.renewable_share_of_load for point in window])
    avg_price = average([point.price_eur_mwh for point in window])
    price_provider = next((point.price_provider for point in window if point.price_provider), None)

    window_renewables = [average([point.renewable_forecast_mw for point in candidate]) for candidate in all_windows]
    window_loads = [average([point.load_forecast_mw for point in candidate]) for candidate in all_windows]
    window_prices = [average([point.price_eur_mwh for point in candidate]) for candidate in all_windows]
    renewable_values = [value for value in window_renewables if value is not None]
    load_values = [value for value in window_loads if value is not None]
    price_values = [value for value in window_prices if value is not None]
    price_available = bool(price_values)
    weights = weights_for_mode(mode, price_available=price_available)

    renewable_score = min_max_score(avg_renewable, min(renewable_values) if renewable_values else None, max(renewable_values) if renewable_values else None)
    low_load_score = min_max_score(avg_load, min(load_values) if load_values else None, max(load_values) if load_values else None, invert=True)
    price_score = min_max_score(avg_price, min(price_values) if price_values else None, max(price_values) if price_values else None, invert=True) if price_available else None

    deadline_utc = deadline.astimezone(UTC) if deadline.tzinfo else deadline.replace(tzinfo=BRUSSELS).astimezone(UTC)
    start = window[0].timestamp_utc
    end = window[-1].timestamp_utc + timedelta(minutes=15)
    total_available = max((deadline_utc - all_windows[0][0].timestamp_utc).total_seconds(), 1)
    time_until_start = max((start - all_windows[0][0].timestamp_utc).total_seconds(), 0)
    convenience_score = clamp(1.0 - (time_until_start / total_available) * 0.5)

    score_values = {
        "price_score": price_score if price_score is not None else 0.0,
        "renewable_score": renewable_score,
        "low_load_score": low_load_score,
        "convenience_score": convenience_score,
    }
    total = sum(score_values[name] * weight for name, weight in weights.items())

    explanations: list[str] = []
    if renewable_score >= 0.66:
        explanations.append("High PV/wind forecast")
    if low_load_score >= 0.66:
        explanations.append("Lower Belgian load")
    if price_score is not None and price_score >= 0.66:
        explanations.append("Lower Belgian day-ahead price")
    appliance_note = appliance_explanation(appliance_impact)
    if appliance_note:
        explanations.append(appliance_note)
    explanations.append("Fits before your deadline")

    return CandidateWindow(
        start_utc=start,
        end_utc=end,
        start_brussels=start.astimezone(BRUSSELS),
        end_brussels=end.astimezone(BRUSSELS),
        score=ScoreBreakdown(
            total=clamp(total),
            renewable_score=renewable_score,
            low_load_score=low_load_score,
            convenience_score=convenience_score,
            price_score=price_score,
            weights=weights,
        ),
        average_load_mw=avg_load,
        average_renewable_mw=avg_renewable,
        average_renewable_share_of_load=avg_share,
        average_price_eur_mwh=avg_price,
        price_provider=price_provider,
        explanations=explanations,
    )


def build_recommendation(
    points: list[ForecastPoint],
    duration_minutes: int,
    deadline: datetime,
    mode: str,
    freshness: list[SourceFreshness],
    appliance: ApplianceProfile | None = None,
    appliance_impact: ApplianceImpact | None = None,
) -> Recommendation:
    windows = generate_candidate_windows(points, duration_minutes, deadline)
    warnings: list[str] = []
    if not windows:
        warnings.append("No feasible windows were found before the deadline.")
        return Recommendation(
            duration_minutes=duration_minutes,
            deadline_brussels=deadline.astimezone(BRUSSELS) if deadline.tzinfo else deadline.replace(tzinfo=BRUSSELS),
            mode=mode,
            appliance=appliance,
            appliance_impact=appliance_impact,
            best_window=None,
            top_windows=[],
            freshness=freshness,
            warnings=warnings,
        )

    price_available = any(point.price_eur_mwh is not None for point in points)
    if mode == "cheapest" and not price_available:
        warnings.append("Price data unavailable; cheapest mode fell back to the non-price score.")

    scored = [score_window(window, windows, deadline, mode, appliance_impact) for window in windows]
    scored.sort(key=lambda candidate: candidate.score.total, reverse=True)
    return Recommendation(
        duration_minutes=duration_minutes,
        deadline_brussels=deadline.astimezone(BRUSSELS) if deadline.tzinfo else deadline.replace(tzinfo=BRUSSELS),
        mode=mode,
        appliance=appliance,
        appliance_impact=appliance_impact,
        best_window=scored[0],
        top_windows=scored[:5],
        freshness=freshness,
        warnings=warnings,
    )
