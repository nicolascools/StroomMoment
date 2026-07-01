# Notes

Freeform research notes for StroomMoment.

## Open Questions

- Can Elia `ods191` near-real-time CO2 become reliable later, or is another CO2 source needed?
- Should historical CO2 from `ods192` be shown in the first nerd view, or should CO2 be hidden until current data works?
- Should Energy-Charts remain the public MVP price source, or should ENTSO-E replace it once token setup is done?
- What is the best default deadline UX: before tonight, before tomorrow morning, or exact date/time?
- Should appliance power assumptions become editable presets later, or remain a simple one-off input?

## Validated API Findings

- Elia `ods002` is usable for Belgian total load, measured values, and forecasts at 15-minute granularity.
- Elia `ods087` is usable for Belgian PV forecasts at 15-minute granularity; use `region="Belgium"`.
- Elia `ods086` is usable for wind forecasts at 15-minute granularity; aggregate by `datetime` and optionally keep onshore/offshore split.
- Elia `ods191` near-real-time CO2 is documented but currently returns zero records.
- Elia `ods192` historical CO2 works at 1-hour granularity but is D-1 and not suitable for future recommendation scoring.
- Elia imbalance and balancing price datasets are reachable but are not suitable as household day-ahead price signals.
- ENTSO-E day-ahead price API returned `401` without a token; official price support requires token setup and XML parsing.
- Energy-Charts `price?bzn=BE` works without authentication and returns 15-minute BE price data, but it is not an official Belgian API and needs attribution.
- Energy-Charts missing future days can return `404`; the backend treats this as unavailable price data and keeps recommendations working.
- RMI/KMI WFS is reachable and can provide recent weather observations, but weather is not needed for the first recommendation engine.

## Implementation Notes

- First backend slice is implemented in FastAPI under `backend/`.
- First frontend slice is implemented in Next.js under `frontend/`.
- Energy-Charts price provider is implemented in `backend/app/api_clients/energy_charts.py` behind the `PriceProvider` protocol.
- Price points are normalized into `PricePoint` and aligned onto `ForecastPoint` records.
- If a price provider returns hourly prices, the normalization layer maps the hourly price to the four corresponding quarter-hour forecast points.
- Energy-Charts `404` responses for unpublished future days are cached briefly so repeated requests do not hammer the provider.
- Backend file cache lives in `backend/.cache/`; Elia uses a 5-minute TTL and Energy-Charts uses a 15-minute TTL.
- Opendatasoft large ungrouped requests failed with `400 Bad Request`; the Elia client now paginates at 100 records per page.
- Next.js build on this Windows environment warned that native SWC was not usable and fell back to WASM. Turbopack failed, so scripts use Webpack.
- Appliance profiles are implemented in `backend/app/scoring/appliances.py` and exposed through `GET /api/appliances`.
- Recommendation requests accept `appliance_id` and optional `power_kw`; the backend returns `appliance` and `appliance_impact` with estimated kWh and capacity-tariff guidance.
- Appliance impact is informational only and does not alter the scoring weights.

## Frontend Stability Notes

- Hydration issue fixed on 2026-07-01: the planner default deadline was computed with `new Date()` during the initial render of a client component. Next.js still pre-renders client components on the server, so the server HTML and first client render could diverge around current-date/default-form state and loading/disabled attributes.
- Fix: the initial render now uses a deterministic stable shell. Brussels-local default deadline calculation and initial data loading run after mount in `useEffect`.
- Rule: do not compute current-time-dependent form defaults, locale-sensitive dates, browser-only state, or API-loaded interactive states during initial render. Initialize them after mount or pass them as serialized server data.

## Product Notes

- The app should avoid looking like a generic dashboard. The key output is a recommendation.
- Data transparency matters because early testers will likely be technical.
- Missing data should be visible, not hidden.
- If recommendation quality is lower because CO2 or price is missing, say so clearly.

## Technical Notes

- Opendatasoft APIs return UTC timestamps; present to users in `Europe/Brussels`.
- Use 15-minute granularity for alignment with Belgian market intervals and capacity-tariff concepts.
- Cache all external API responses.
- Local generated state exists during development and must stay untracked: backend `.cache`, `.venv`, `.pytest_cache`, `__pycache__`, frontend `.next`, and `node_modules`.
- Keep raw source timestamps and freshness metadata.
- Start simple: no queue, no worker, no TimescaleDB unless needed.
- For the first data fetcher, fetch and normalize Elia `ods002`, `ods087`, and `ods086` only.
- For MVP scoring, omit unavailable CO2 and price metrics and renormalize weights.

## Deployment Notes

- Public PoC target is `https://poc.coolsnet.com`.
- The public Compose deployment uses a small Caddy router so the browser can call same-origin `/api/...` and the backend service is not directly exposed.
- The previous wall-screen PoC on `poc.coolsnet.com` can be removed or bypassed when StroomMoment is live.
- No Git remote exists yet; first deployment may use a temporary Git bundle/manual copy, but Git pull deployment is preferred once a remote exists.
- Persistent file cache is enough for the PoC. Keep SQLite, PostgreSQL, TimescaleDB, and InfluxDB open for later discussion.
