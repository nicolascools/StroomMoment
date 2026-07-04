from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.models import ForecastPoint
from app.scoring.windows import build_recommendation, generate_candidate_windows

BRUSSELS = ZoneInfo("Europe/Brussels")


def make_point(index: int, load: float, renewable: float, price: float | None = None) -> ForecastPoint:
    timestamp = datetime(2026, 7, 1, 10, 0, tzinfo=UTC) + timedelta(minutes=15 * index)
    return ForecastPoint(
        timestamp_utc=timestamp,
        timestamp_brussels=timestamp.astimezone(BRUSSELS),
        load_forecast_mw=load,
        pv_forecast_mw=renewable * 0.75,
        wind_forecast_mw=renewable * 0.25,
        renewable_forecast_mw=renewable,
        renewable_share_of_load=renewable / load,
        price_eur_mwh=price,
        price_provider="test-provider" if price is not None else None,
    )


def test_candidate_window_generation_uses_contiguous_15_minute_points() -> None:
    points = [make_point(i, 1000, 100) for i in range(8)]
    deadline = datetime(2026, 7, 1, 14, 0, tzinfo=BRUSSELS)

    windows = generate_candidate_windows(points, duration_minutes=60, deadline=deadline)

    assert len(windows) == 5
    assert len(windows[0]) == 4


def test_scoring_prefers_high_renewable_lower_load_balanced_window() -> None:
    points = [
        make_point(0, 1200, 100),
        make_point(1, 1200, 100),
        make_point(2, 900, 500),
        make_point(3, 900, 500),
        make_point(4, 1300, 100),
        make_point(5, 1300, 100),
    ]
    deadline = datetime(2026, 7, 1, 13, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(
        points=points,
        duration_minutes=30,
        deadline=deadline,
        mode="balanced",
        freshness=[],
    )

    assert recommendation.best_window is not None
    assert recommendation.best_window.start_utc == points[2].timestamp_utc
    assert recommendation.best_window.score.renewable_score == 1.0
    assert recommendation.best_window.score.low_load_score == 1.0
    assert "High PV/wind forecast" in recommendation.best_window.explanations
    assert "Lower Belgian load" in recommendation.best_window.explanations


def test_balanced_scoring_uses_price_when_available() -> None:
    points = [
        make_point(0, 1000, 100, 200),
        make_point(1, 1000, 100, 200),
        make_point(2, 1000, 500, 50),
        make_point(3, 1000, 500, 50),
    ]
    deadline = datetime(2026, 7, 1, 13, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(points, 30, deadline, "balanced", [])

    assert recommendation.best_window is not None
    assert recommendation.best_window.start_utc == points[2].timestamp_utc
    assert recommendation.best_window.score.price_score == 1.0
    assert recommendation.best_window.score.weights["price_score"] == 0.35
    assert "Lower Belgian day-ahead price" in recommendation.best_window.explanations


def test_cheapest_mode_prioritizes_price() -> None:
    points = [
        make_point(0, 900, 600, 300),
        make_point(1, 900, 600, 300),
        make_point(2, 1300, 50, 10),
        make_point(3, 1300, 50, 10),
    ]
    deadline = datetime(2026, 7, 1, 13, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(points, 30, deadline, "cheapest", [])

    assert recommendation.best_window is not None
    assert recommendation.best_window.start_utc == points[2].timestamp_utc
    assert recommendation.best_window.score.weights["price_score"] == 0.85


def test_avoid_windows_listed_when_enough_candidates() -> None:
    points = [make_point(index, 1000 + index * 25, 500 - index * 20) for index in range(16)]
    deadline = datetime(2026, 7, 1, 16, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(points, 30, deadline, "balanced", [])

    assert len(recommendation.avoid_windows) == 3
    # Worst window first, and no overlap with the recommended top windows.
    avoid_totals = [window.score.total for window in recommendation.avoid_windows]
    assert avoid_totals == sorted(avoid_totals)
    top_starts = {window.start_utc for window in recommendation.top_windows}
    avoid_starts = {window.start_utc for window in recommendation.avoid_windows}
    assert top_starts.isdisjoint(avoid_starts)
    assert recommendation.best_window is not None
    assert recommendation.avoid_windows[0].score.total <= recommendation.best_window.score.total


def test_avoid_windows_empty_with_few_candidates() -> None:
    points = [make_point(index, 1000, 100) for index in range(4)]
    deadline = datetime(2026, 7, 1, 13, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(points, 30, deadline, "balanced", [])

    assert recommendation.avoid_windows == []


def test_cheapest_mode_falls_back_without_price_data() -> None:
    points = [make_point(index, 1000, 100) for index in range(4)]
    deadline = datetime(2026, 7, 1, 13, 0, tzinfo=BRUSSELS)

    recommendation = build_recommendation(points, 30, deadline, "cheapest", [])

    assert recommendation.best_window is not None
    assert recommendation.best_window.score.price_score is None
    assert recommendation.warnings == ["Price data unavailable; cheapest mode fell back to the non-price score."]
