import { dayLabel, formatPriceShort, scorePercent, windowLabel } from "../lib/format";
import type { CandidateWindow, Recommendation } from "../lib/types";

type Props = { recommendation: Recommendation };

// Secondary options: good alternatives to the best window, plus windows to avoid.
export function AlternativeWindows({ recommendation }: Props) {
  const best = recommendation.best_window;
  if (!best) return null;

  const alternatives = recommendation.top_windows.filter(
    (item) => !(item.start_utc === best.start_utc && item.end_utc === best.end_utc),
  );
  const avoidWindows = recommendation.avoid_windows ?? [];
  if (!alternatives.length && !avoidWindows.length) return null;

  return (
    <section className="card alternatives-card">
      {alternatives.length ? (
        <>
          <h2>Also good</h2>
          <p className="hint">If the best window does not suit you. Same relative scoring, same deadline.</p>
          <div className="alt-grid">
            {alternatives.map((item) => (
              <AlternativeCard key={`${item.start_utc}-${item.end_utc}`} window={item} />
            ))}
          </div>
        </>
      ) : null}

      {avoidWindows.length ? (
        <div className="avoid-block">
          <h3>Better to avoid</h3>
          <p className="hint">The weakest feasible windows before your deadline.</p>
          <div className="avoid-chips">
            {avoidWindows.map((item) => (
              <span className="avoid-chip" key={`${item.start_utc}-${item.end_utc}`}>
                <b>{windowLabel(item)}</b>
                <span>{dayLabel(item.start_brussels)}</span>
                <span>{scorePercent(item.score.total)}</span>
                {item.average_price_eur_mwh !== null ? <span>{formatPriceShort(item.average_price_eur_mwh)}</span> : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AlternativeCard({ window }: { window: CandidateWindow }) {
  return (
    <article className="alt-card">
      <div className="alt-head">
        <strong>{windowLabel(window)}</strong>
        <span className="alt-day">{dayLabel(window.start_brussels)}</span>
      </div>
      <div className="alt-score">
        <div className="alt-track">
          <i style={{ width: scorePercent(window.score.total) }} />
        </div>
        <b>{scorePercent(window.score.total)}</b>
      </div>
      <div className="alt-meta">
        {window.score.price_score !== null ? <span className="tone-price">Price {scorePercent(window.score.price_score)}</span> : null}
        <span className="tone-renewable">Green {scorePercent(window.score.renewable_score)}</span>
        <span className="tone-load">Grid {scorePercent(window.score.low_load_score)}</span>
      </div>
    </article>
  );
}
