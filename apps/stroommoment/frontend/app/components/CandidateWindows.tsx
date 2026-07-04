import { formatPriceShort, scorePercent, windowLabel } from "../lib/format";
import type { CandidateWindow } from "../lib/types";

type Props = {
  topWindows: CandidateWindow[];
  avoidWindows: CandidateWindow[];
};

export function CandidateWindows({ topWindows, avoidWindows }: Props) {
  if (!topWindows.length) return null;
  return (
    <section className="card candidates-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow mini">Top windows</p>
          <h2>Score breakdown</h2>
        </div>
        <p className="hint">Ranked by the active optimization mode. Scores are relative to today's feasible windows, not absolute market levels.</p>
      </div>
      <div className="candidate-list">
        {topWindows.map((window) => (
          <article className="candidate-bar" key={`${window.start_brussels}-${window.end_brussels}`}>
            <div className="candidate-main">
              <strong>{windowLabel(window)}</strong>
              <span>{scorePercent(window.score.total)} total</span>
            </div>
            <div className="bar-track" aria-label={`Total score ${scorePercent(window.score.total)}`}>
              <div className="bar-fill" style={{ width: scorePercent(window.score.total) }} />
            </div>
            <div className="component-bars">
              {window.score.price_score !== null ? <ScoreMiniBar label="Price" value={window.score.price_score} /> : null}
              <ScoreMiniBar label="Renewable" value={window.score.renewable_score} />
              <ScoreMiniBar label="Low load" value={window.score.low_load_score} />
              <ScoreMiniBar label="Convenience" value={window.score.convenience_score} />
            </div>
          </article>
        ))}
      </div>
      {avoidWindows.length ? (
        <div className="avoid-section">
          <h3>Consider avoiding</h3>
          <p className="hint">The weakest feasible windows before your deadline, based on the same scoring.</p>
          <ul className="avoid-list">
            {avoidWindows.map((window) => (
              <li key={`${window.start_brussels}-${window.end_brussels}`}>
                <strong>{windowLabel(window)}</strong>
                <span>{scorePercent(window.score.total)} total</span>
                {window.average_price_eur_mwh !== null ? <span>avg {formatPriceShort(window.average_price_eur_mwh)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ScoreMiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mini-bar">
      <span>{label}</span>
      <div><i style={{ width: scorePercent(value) }} /></div>
      <b>{scorePercent(value)}</b>
    </div>
  );
}
