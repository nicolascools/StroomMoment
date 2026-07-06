import { FEEDBACK_URL } from "../lib/api";

type Props = {
  dataStatus: "ok" | "warn" | null;
};

export function TopBar({ dataStatus }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="18">
            <path d="M13 2.5L5 13.5h5.5L11 21.5l8-11h-5.5z" />
          </svg>
        </span>
        <span className="brand-name">StroomMoment</span>
        <span className="brand-tag">BE</span>
      </div>
      <div className="topbar-actions">
        {dataStatus ? (
          <span className={`data-pill ${dataStatus}`}>
            <i aria-hidden="true" />
            {dataStatus === "ok" ? "Live data" : "Partial data"}
          </span>
        ) : null}
        {FEEDBACK_URL ? (
          <a className="topbar-link" href={FEEDBACK_URL} rel="noreferrer" target="_blank">Feedback</a>
        ) : null}
      </div>
    </header>
  );
}
