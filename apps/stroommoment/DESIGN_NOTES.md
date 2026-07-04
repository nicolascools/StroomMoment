# Design Notes for Deferred Roadmap Items

These items are intentionally **not implemented**. Each section records the current thinking so a future slice can start without re-research. Implementing any of these requires an explicit product decision first.

## 1. Storage Roadmap

Current state: persistent file cache only (`backend/.cache` locally, `/var/lib/stroommoment/cache` on the PoC host). The app is stateless from the user perspective.

| Option | Use when | Avoid because |
| --- | --- | --- |
| File cache (current) | Upstream API response caching for a stateless PoC | No querying, no history, silent corruption handling only |
| SQLite | First need for history: signal snapshots, debugging upstream gaps, percentile-based absolute price scores, historical charts | Single-writer; not for multi-host or user accounts |
| PostgreSQL | User accounts, saved server-side profiles, shared state across services | Operational overhead (backups, migrations) not justified yet |
| TimescaleDB | Large signal history with retention/aggregation policies and SQL analytics | Decide together with PostgreSQL; pointless before history is a core feature |
| InfluxDB | Ops/metrics dashboards (Grafana habit), Home Assistant-style measurements | App data is relational-ish; adds a second query language |

Recommendation:
- Now: keep file cache.
- Next (first concrete trigger): SQLite snapshot table of normalized `ForecastPoint` rows per fetch, written by the existing signal service. Triggers: "what did the data look like yesterday?", absolute score anchors, or historical charts.
- Later: PostgreSQL (+Timescale extension if needed) only when accounts or multi-service state exist.
- Avoid: InfluxDB unless a metrics/Grafana stack becomes part of the household integration story.

## 2. User Accounts

Why not now: the PoC is intentionally stateless and public; `localStorage` covers per-device planner preferences without any privacy surface.

When accounts become justified:
- server-side saved appliance profiles and tariffs
- notifications (need a stable delivery target)
- P1/Home Assistant pairing (need to associate a household with data)

What would be stored (minimum): auth identity (external IdP or magic link preferred over passwords), saved appliance defaults, tariff/contract parameters, notification preferences. No consumption data unless P1 integration lands.

Privacy implications: consumption and peak data are sensitive household data; GDPR applies. Store nothing personal until there is a real feature that needs it. Prefer EU hosting and data minimization when it happens.

## 3. P1 / Home Assistant Integration

Goal: real `kwartierpiek` peak-safety instead of educational notes.

Likely architecture:
- Local-first: a small agent or Home Assistant integration reads P1 (via serial/USB dongle or existing HA sensor) and computes the running 15-minute average locally.
- StroomMoment consumes either: (a) HA REST/WebSocket sensor pushed to a local StroomMoment endpoint, or (b) MQTT topics (`stroommoment/household/load`, `.../quarter_peak`).
- Recommendation engine gains a `peak_safety_score` component that only activates when live household load exists.

Peak-safety requirements before implementing:
- current household load (W), current quarter-hour average, monthly peak so far, contracted/target peak.
- clear failure mode: if live data stops, fall back to informational-only notes (never guess).

Do not build cloud ingestion of P1 data for the public PoC; this should start as a local/self-hosted feature.

## 4. ENTSO-E Price Provider

Why: official source for BE day-ahead prices; Energy-Charts is a re-publisher (CC BY 4.0) and could change.

Interface: the existing `PriceProvider` protocol (`fetch_prices(start_date, end_date) -> PriceResponse`) is sufficient. Implement `EntsoeClient` beside `EnergyChartsClient`; selection via env var (e.g., `STROOMMOMENT_PRICE_PROVIDER=entsoe|energy-charts`) with fallback to the other provider on failure.

Needs before implementing:
- ENTSO-E API token (free registration) and secure env/config handling (`ENTSOE_API_TOKEN`) — first real secret in the project; keep out of Git, document in `.env.example`.
- XML parsing (Publication_MarketDocument) with position/resolution handling; PT15M vs PT60M both occur.
- Timezone care: ENTSO-E intervals are UTC; reuse existing normalization.

Effort: medium. Blocked on: user decision to register a token.

## 5. Notifications

What it would be: "tell me when a good window starts" (web push, email, or HA notify).

Trigger analysis:
- Web push: needs service worker + subscription storage → first server-side persistent user data (subscription endpoints), effectively a lightweight account.
- Email: needs address storage + sending infra (GDPR, spam handling).
- Home Assistant notify: cleanest fit — StroomMoment exposes a "next best window" sensor/API and HA does the notifying locally; no accounts needed.

Recommendation: when notifications are wanted, start with the HA/local path (fits Phase 4) and defer push/email until accounts exist for other reasons.

## 6. Docker Hardening (deferred small item)

The backend container currently runs as root. Adding a non-root `USER` requires matching the UID with the host-owned cache mount (`/var/lib/stroommoment/cache`, owned by `nicolas`) — a change that must be verified on the live host, not blindly shipped. Do this together with the next planned deployment, not as a hotfix.
