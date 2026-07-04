import { FEEDBACK_URL } from "../lib/api";

export function FeedbackBlock() {
  return (
    <div className="feedback-card">
      <strong>Tester feedback</strong>
      <p>Spot confusing advice, stale data, or weird appliance assumptions?</p>
      {FEEDBACK_URL ? (
        <a className="button-link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Send feedback</a>
      ) : (
        <p className="hint">Feedback channel coming soon.</p>
      )}
    </div>
  );
}
