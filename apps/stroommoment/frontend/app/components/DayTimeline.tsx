import { formatTime, windowLabel } from "../lib/format";
import type { CandidateWindow, Recommendation } from "../lib/types";

type Props = { recommendation: Recommendation };

// Visual answer strip: now -> deadline, with good and avoid windows placed in time.
// Client-only (uses Date.now); the page renders it after mount.
export function DayTimeline({ recommendation }: Props) {
  const best = recommendation.best_window;
  if (!best) return null;

  const start = Date.now();
  const end = new Date(recommendation.deadline_brussels).getTime();
  if (!Number.isFinite(end) || end - start < 30 * 60 * 1000) return null;

  const span = end - start;
  const position = (iso: string) => clampPercent(((new Date(iso).getTime() - start) / span) * 100);

  const goodWindows = recommendation.top_windows;
  const avoidWindows = recommendation.avoid_windows ?? [];
  const ticks = buildTicks(start, end);

  return (
    <section className="card timeline-card">
      <div className="timeline-head">
        <h2>Your window until the deadline</h2>
        <div className="timeline-legend">
          <span className="legend best">Best</span>
          <span className="legend good">Also good</span>
          {avoidWindows.length ? <span className="legend avoid">Avoid</span> : null}
        </div>
      </div>

      <div className="timeline">
        <TimelineLane
          ariaLabel="Good windows"
          isBest={(item) => item.start_utc === best.start_utc && item.end_utc === best.end_utc}
          position={position}
          tone="good"
          windows={goodWindows}
        />
        {avoidWindows.length ? (
          <TimelineLane ariaLabel="Windows to avoid" isBest={() => false} position={position} tone="avoid" windows={avoidWindows} />
        ) : null}
        <div className="timeline-axis">
          <span className="axis-now">now</span>
          {ticks.map((tick) => (
            <span className="axis-tick" key={tick.time} style={{ left: `${tick.percent}%` }}>
              {tick.label}
            </span>
          ))}
          <span className="axis-deadline">deadline {formatTime(recommendation.deadline_brussels)}</span>
        </div>
      </div>
    </section>
  );
}

function TimelineLane({
  windows,
  position,
  tone,
  isBest,
  ariaLabel,
}: {
  windows: CandidateWindow[];
  position: (iso: string) => number;
  tone: "good" | "avoid";
  isBest: (item: CandidateWindow) => boolean;
  ariaLabel: string;
}) {
  return (
    <div aria-label={ariaLabel} className={`timeline-lane ${tone}`} role="list">
      {windows.map((item) => {
        const left = position(item.start_utc);
        const right = position(item.end_utc);
        const width = Math.max(right - left, 1.5);
        const best = isBest(item);
        return (
          <span
            className={`timeline-block${best ? " best" : ""}`}
            key={`${item.start_utc}-${item.end_utc}`}
            role="listitem"
            style={{ left: `${left}%`, width: `${width}%` }}
            title={windowLabel(item)}
          >
            {best ? <b>{windowLabel(item)}</b> : null}
          </span>
        );
      })}
    </div>
  );
}

function buildTicks(start: number, end: number) {
  const span = end - start;
  const count = 4;
  const ticks: { label: string; percent: number; time: number }[] = [];
  for (let index = 1; index <= count; index += 1) {
    const time = start + (span * index) / (count + 1);
    ticks.push({
      label: formatTime(new Date(time).toISOString()),
      percent: (100 * index) / (count + 1),
      time,
    });
  }
  return ticks;
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
