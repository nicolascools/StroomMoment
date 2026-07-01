# Scoring Model

The scoring model should be simple, explainable, and configurable in code.

The app should always produce both:

- a simple recommendation
- a transparent score breakdown

## Candidate Windows

For a selected appliance, duration, and deadline, generate candidate start times in 15-minute increments.

Each candidate window covers a sequence of forecast points. The window score is based on the average or aggregate score across those points.

## Public MVP Scores

### CO2 Score

Lower CO2 intensity should score higher.

Status:

- Include when a reliable current/forecast CO2 source is available.
- If only historical CO2 is available, show it in data view but do not over-weight it for future recommendations.

### Renewable Score

Higher renewable availability should score higher.

Initial proxy:

- solar forecast MW
- wind forecast MW
- optionally renewable share calculated against load

### Load Score

Lower Belgian grid load should score higher.

Rationale:

- Avoiding already high-load windows is grid-friendly.
- It helps avoid recommending the classic evening peak.

### Convenience/Deadline Score

Earlier or more practical windows can score slightly higher depending on the deadline.

Rationale:

- If two windows are similar, the app should prefer a convenient one.
- This should not dominate energy quality.

## Initial Balanced Weights

Current v0.1 implementation uses Elia load/PV/wind plus optional Energy-Charts BE day-ahead price data.

When price data is available:

```text
balanced_score =
  35% price_score
  25% renewable_score
  20% low_load_score
  20% convenience_score
```

When price data is unavailable:

```text
score =
  45% renewable_score
  35% low_load_score
  20% convenience_score
```

Mode-specific variants:

```text
renewable mode =
  70% renewable_score
  15% low_load_score
  15% convenience_score

low_load mode =
  with price:
    65% low_load_score
    10% price_score
    10% renewable_score
    15% convenience_score

  without price:
    20% renewable_score
    65% low_load_score
    15% convenience_score

cheapest mode =
  with price:
    85% price_score
    15% convenience_score

  without price:
    falls back to the non-price balanced score and returns a warning
```

These weights are implemented in `backend/app/scoring/weights.py`.

CO2 is intentionally omitted from current scoring because no reliable current/forecast CO2 source has been validated.

Price is a wholesale/day-ahead bidding-zone signal for BE. It is not the user's exact supplier tariff or total electricity bill price. Actual cost depends on contract terms, supplier markup, taxes, grid fees, VAT, and other billing components.

Appliance profiles currently affect duration defaults, estimated energy, explanation text, and capacity-tariff guidance. They do not change score weights yet.

Capacity-tariff / `kwartierpiek` handling is informational in the public MVP. Without live household meter data, the app must not claim that a proposed start time will or will not create a new monthly 15-minute peak.

## Optional Later Scores

### Price Score

Lower day-ahead price should score higher.

Use only when data is available and fresh. Current implementation calculates price score by min/max scaling candidate-window average `price_eur_mwh` values within the feasible windows, with lower prices scoring closer to `1.0`.

### Peak Safety Score

Avoid creating a new household monthly 15-minute peak.

MVP approach:

- explain capacity tariff / `kwartierpiek`
- support appliance-profile defaults and optional/manual power assumptions
- estimate appliance energy from `power_kw * duration_hours` when power is known
- optionally support a manual monthly peak target later

Real approach later:

- use P1/Home Assistant/local load data
- estimate whether starting an appliance would create a new high 15-minute peak

### User Custom Weights

Later, technical users may choose their own weights:

- greenest
- cheapest
- avoid peak
- balanced
- custom nerd mode

## Recommendation Output

For each recommendation, show:

- start time
- end time
- total score
- CO2 score when available
- renewable score
- load score
- price score when available
- convenience score
- peak-safety score when available
- explanation strings such as "high solar forecast" or "lower Belgian load"
- confidence/freshness warning when inputs are stale or missing
