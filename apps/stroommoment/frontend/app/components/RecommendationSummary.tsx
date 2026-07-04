import { formatDateTime, formatNumber, formatPrice, formatTime, scorePercent } from "../lib/format";
import type { Recommendation } from "../lib/types";

type Props = {
  recommendation: Recommendation | null;
  freshnessWarning: boolean;
  loading: boolean;
};

export function RecommendationSummary({ recommendation, freshnessWarning, loading }: Props) {
  const window = recommendation?.best_window;

  if (!recommendation && loading) {
    return (
      <div className="recommendation-summary">
        <h2>Best Recommendation</h2>
        <p>Calculating a first recommendation...</p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="recommendation-summary">
        <h2>Best Recommendation</h2>
        <p className="warning">No recommendation could be calculated. Belgian signal data may be temporarily unavailable.</p>
      </div>
    );
  }

  if (!window) {
    return (
      <div className="recommendation-summary">
        <h2>No feasible window</h2>
        <p>
          Nothing fits between now and {formatDateTime(recommendation.deadline_brussels)} for a {recommendation.duration_minutes}-minute run.
        </p>
        <p className="hint">Try a later deadline, a shorter duration, or check back once new forecast data is published.</p>
        {recommendation.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
      </div>
    );
  }

  const priceContributed = window.score.price_score !== null && (window.score.weights.price_score ?? 0) > 0;

  return (
    <div className="recommendation-summary">
      <p className="eyebrow mini">Best window</p>
      <h2>{formatTime(window.start_brussels)}-{formatTime(window.end_brussels)}</h2>
      <p>
        {recommendation.appliance?.label ?? "Selected load"}, {recommendation.duration_minutes} minutes before {formatDateTime(recommendation.deadline_brussels)}.
      </p>
      <div className="score-grid">
        <span>Total {scorePercent(window.score.total)}</span>
        {window.score.price_score !== null ? <span>Price {scorePercent(window.score.price_score)}</span> : null}
        <span>Renewable {scorePercent(window.score.renewable_score)}</span>
        <span>Low load {scorePercent(window.score.low_load_score)}</span>
        <span>Convenience {scorePercent(window.score.convenience_score)}</span>
      </div>
      <p className="hint">Scores compare today's feasible windows: 100% means best available before your deadline, not absolutely cheap or green.</p>
      <h3>Why this window</h3>
      <ul className="reason-list">
        {window.explanations.map((explanation) => <li key={explanation}>{explanation}</li>)}
        <li>{priceContributed ? "Price data contributed to the score." : "Price data did not drive this recommendation."}</li>
        <li>{window.average_renewable_share_of_load !== null ? `PV/wind forecast covers about ${scorePercent(window.average_renewable_share_of_load)} of Belgian load in this window.` : "Renewable-share data is incomplete for this window."}</li>
        <li>{window.average_load_mw !== null ? `Belgian load forecast averages ${formatNumber(window.average_load_mw)} MW.` : "Belgian load data is incomplete for this window."}</li>
        <li>{freshnessWarning ? "Some source data is stale or unavailable; check the Data Sources panel." : "Source freshness looks usable for this recommendation."}</li>
      </ul>
      {window.average_price_eur_mwh !== null ? <p className="hint">Average day-ahead price in this window: {formatPrice(window.average_price_eur_mwh)}.</p> : null}
      {recommendation.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
    </div>
  );
}
