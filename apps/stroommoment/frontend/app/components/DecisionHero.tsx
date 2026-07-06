import {
  dayLabel,
  formatDateTime,
  formatNumber,
  formatPriceShort,
  formatTime,
  modeLabel,
  scorePercent,
  startsInLabel,
} from "../lib/format";
import type { ForecastPoint, Recommendation } from "../lib/types";

type Props = {
  recommendation: Recommendation | null;
  loading: boolean;
  currentPoint: ForecastPoint | undefined;
  freshnessWarning: boolean;
};

// The primary visual object of the page: the answer to "when should I run this appliance?"
export function DecisionHero({ recommendation, loading, currentPoint, freshnessWarning }: Props) {
  const window = recommendation?.best_window ?? null;

  if (!recommendation) {
    return (
      <section className="hero-card hero-empty">
        <p className="hero-eyebrow">StroomMoment</p>
        <h1 className="hero-question">When should I use electricity?</h1>
        <p className="hero-sub">
          {loading
            ? "Reading Belgian grid forecasts and day-ahead prices..."
            : "Belgian signal data could not be loaded right now. Try again in a few minutes."}
        </p>
      </section>
    );
  }

  if (!window) {
    return (
      <section className="hero-card hero-empty">
        <p className="hero-eyebrow">No feasible window</p>
        <h1 className="hero-question">Nothing fits before your deadline</h1>
        <p className="hero-sub">
          A {recommendation.duration_minutes}-minute run does not fit between now and {formatDateTime(recommendation.deadline_brussels)}.
        </p>
        <div className="hero-suggestions">
          <span>Try a later deadline</span>
          <span>Try a shorter duration</span>
          <span>Check back when new forecasts land</span>
        </div>
        {recommendation.warnings.map((warning) => (
          <p className="hero-warning" key={warning}>{warning}</p>
        ))}
      </section>
    );
  }

  const applianceLabel = recommendation.appliance?.label ?? "your appliance";

  return (
    <section className={`hero-card${loading ? " is-refreshing" : ""}`}>
      <div className="hero-top">
        <p className="hero-eyebrow">Best moment for {applianceLabel.toLowerCase()}</p>
        <span className="hero-mode">{modeLabel(recommendation.mode)}</span>
      </div>

      <h1 className="hero-time">
        {formatTime(window.start_brussels)}
        <span className="hero-arrow" aria-hidden="true"> &rarr; </span>
        {formatTime(window.end_brussels)}
      </h1>

      <div className="hero-chips">
        <span className="hero-chip day">{dayLabel(window.start_brussels)}</span>
        <span className="hero-chip">{startsInLabel(window.start_brussels)}</span>
        <span className="hero-chip subtle">Done before {formatTime(recommendation.deadline_brussels)} deadline</span>
      </div>

      <div className="hero-meters" role="list" aria-label="Score breakdown">
        <Meter label="Overall" value={window.score.total} tone="total" />
        {window.score.price_score !== null ? <Meter label="Price" value={window.score.price_score} tone="price" /> : null}
        <Meter label="Renewables" value={window.score.renewable_score} tone="renewable" />
        <Meter label="Quiet grid" value={window.score.low_load_score} tone="load" />
        <Meter label="Convenience" value={window.score.convenience_score} tone="convenience" />
      </div>
      <p className="hero-fineprint">
        Scores compare today&apos;s feasible windows: 100% is the best available before your deadline, not absolutely cheap or green.
      </p>

      <div className="hero-why">
        <h2>Why this window</h2>
        <ul>
          {window.explanations.map((explanation) => (
            <li key={explanation}>{explanation}</li>
          ))}
          {window.average_renewable_share_of_load !== null ? (
            <li>PV/wind covers about {scorePercent(window.average_renewable_share_of_load)} of Belgian load here.</li>
          ) : null}
          {window.average_price_eur_mwh !== null ? (
            <li>Average day-ahead price in this window: {formatPriceShort(window.average_price_eur_mwh)}.</li>
          ) : null}
        </ul>
      </div>

      {recommendation.warnings.map((warning) => (
        <p className="hero-warning" key={warning}>{warning}</p>
      ))}
      {freshnessWarning ? (
        <p className="hero-warning">Some source data is stale or unavailable; see the data sources section below.</p>
      ) : null}

      {currentPoint ? (
        <div className="hero-now">
          <span className="hero-now-label">Belgian grid right now</span>
          <div className="hero-now-stats">
            <span>Load {formatNumber(currentPoint.load_forecast_mw)} MW</span>
            <span>PV + wind {formatNumber(currentPoint.renewable_forecast_mw)} MW</span>
            {currentPoint.renewable_share_of_load !== null ? (
              <span>{scorePercent(currentPoint.renewable_share_of_load)} renewable</span>
            ) : null}
            {currentPoint.price_eur_mwh !== null ? <span>{formatPriceShort(currentPoint.price_eur_mwh)}</span> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`hero-meter tone-${tone}`} role="listitem">
      <div className="hero-meter-head">
        <span>{label}</span>
        <b>{scorePercent(value)}</b>
      </div>
      <div className="hero-meter-track">
        <i style={{ width: scorePercent(value) }} />
      </div>
    </div>
  );
}
