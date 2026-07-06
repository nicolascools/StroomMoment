# Architecture

This is the proposed pragmatic architecture for the first implementation. It is intentionally simple and optimized for a working vertical slice.

## Recommended Stack

### Backend

Use **Python FastAPI**.

Reasons:

- fast to build APIs and scoring prototypes
- good async HTTP client support
- clear separation between API clients, normalization, and scoring
- easy to package with Docker
- suitable for future MQTT/Home Assistant integration work

### Frontend

Use **Next.js** for the MVP.

Reasons:

- practical ecosystem for forms, charts, tables, and deployment
- good fit for a public webapp with dashboard-like views
- easy API integration with FastAPI
- familiar patterns for incremental MVP development

SvelteKit would also be a good fit, but Next.js is the default recommendation for fastest chart/form implementation unless a future decision changes this.

Current implementation: Next.js App Router in `frontend/`. The local scripts use Webpack (`next dev --webpack`, `next build --webpack`) because this Windows environment fell back to WASM SWC bindings and Turbopack requires native bindings.

### Database

Start with **SQLite**.

Current implementation: file cache in `backend/.cache/` for the first slice. SQLite is still the likely next step if cache inspection or snapshot persistence becomes useful.

Use it for:

- API response cache
- normalized time-series snapshots if needed
- local development simplicity

Move to PostgreSQL when:

- multiple users or environments need shared state
- stored historical snapshots become important
- more advanced querying is needed

Consider TimescaleDB only later if time-series volume and retention justify it.

### Deployment

Use **Docker Compose**.

Current implementation: `docker-compose.yml` starts `backend` and `frontend`. Docker is optional for local development.

Initial services should eventually be:

- `backend`: FastAPI application
- `frontend`: Next.js app
- optional `db`: PostgreSQL later, not required for SQLite MVP

### Charts

Use a practical JavaScript chart library such as **Recharts** for the MVP.

Current implementation: no chart library yet. The first nerd view uses a data table to keep the vertical slice small.

Reasons:

- enough for line/area charts and tooltips
- fast integration with React/Next.js
- no need for heavy BI/dashboard tooling

## Logical Modules

### API Clients

Responsible for external data access only.

Current modules:

- `api_clients/elia.py`
- `api_clients/energy_charts.py`
- `api_clients/entsoe.py`
- `api_clients/kmi.py`

Rules:

- use caching
- set reasonable timeouts
- do not hammer public APIs
- return source-specific raw records or typed DTOs, not recommendation logic

Current implementation:

- `backend/app/api_clients/elia.py` fetches Elia `ods002`, `ods087`, and `ods086`.
- External calls are cached server-side for 5 minutes.
- Opendatasoft pagination is handled at 100 records per page.
- `backend/app/api_clients/price_base.py` defines the price-provider protocol.
- `backend/app/api_clients/energy_charts.py` implements the first BE day-ahead price provider.

### Data Normalization

Responsible for turning external data into internal `ForecastPoint` records.

Rules:

- normalize time to UTC internally
- expose/present `Europe/Brussels`
- align records to 15-minute intervals where possible
- preserve source timestamps and freshness metadata
- tolerate missing optional signals

Current implementation:

- Elia fetch failures are negative-cached for a short TTL (90 s) so an upstream outage does not trigger a full paginated fetch fan-out on every request; public API errors return sanitized messages while details go to server logs.
- `backend/app/services/normalization.py` aligns load, PV, and wind into `ForecastPoint` records.
- Raw UTC timestamps are stored as `timestamp_utc`.
- Brussels display timestamps are exposed as `timestamp_brussels`.
- PV uses `region="Belgium"`.
- Wind is aggregated by `datetime` using summed forecast values.
- Energy-Charts prices are normalized into `PricePoint` records and aligned onto 15-minute forecast points.
- If a price provider returns hourly prices later, the normalization layer can map each hourly price to the four matching quarter-hour slots.

### Scoring Engine

Responsible for candidate windows and score breakdowns.

Expected future modules:

- `scoring/appliances.py`
- `scoring/weights.py`
- `scoring/windows.py`

Rules:

- keep weights configurable in code
- explain every recommendation with component scores
- renormalize weights when optional metrics are unavailable
- keep capacity-tariff logic honest and manual until personal meter data exists

Current implementation:

- `backend/app/scoring/windows.py` generates candidate windows and scores them.
- `backend/app/scoring/weights.py` keeps mode weights configurable.
- `backend/app/scoring/appliances.py` owns the static appliance profile catalog and informational capacity-tariff impact text.
- Current public MVP score uses renewable, low-load, convenience, and optional price components.
- Price-aware scoring is enabled when Energy-Charts price data is available.
- `cheapest` mode prioritizes price while still respecting the deadline and duration.
- Appliance profiles affect defaults, estimated energy, and explanation text, but not score weights.

### Recommendation API

FastAPI endpoints should expose normalized data and recommendation results.

Likely first endpoints:

- `GET /api/signals`
- `POST /api/recommendations`
- `GET /api/sources`

Current implementation:

- `GET /health`
- `GET /api/signals?hours=48`
- `GET /api/appliances`
- `GET /api/recommendations?appliance_id=dishwasher&duration_minutes=120&power_kw=1.2&deadline=...&mode=balanced`

`POST /api/recommendations` and `GET /api/sources` can be added later if needed. The first slice uses `GET` for simpler browser testing.

### Frontend UI

The frontend should stay presentation-focused.

Initial screens:

- public energy status
- appliance planner
- recommendation result
- data/nerd view

Current implementation: a decision-first "console" layout. `app/page.tsx` is a thin client orchestrator; the visual hierarchy is: top bar (brand + data-status pill), `DecisionHero` (the answer: best window time range, day/starts-in chips, score meters, why-list, grid-now strip), `DayTimeline` (now-to-deadline strip with good and avoid lanes), `PlannerCard` (guided three-step planner: appliance icon tiles, segmented priority control, deadline preset chips + custom picker, collapsible fine-tune), `AlternativeWindows` (also-good cards and avoid chips), and three collapsible `Disclosure` sections for charts, the nerd table, and data sources/disclaimers. Shared logic lives in `app/lib/` (`types.ts`, `format.ts`, `api.ts`, `prefs.ts`). Recharts renders the secondary signal charts from already-normalized API data. Planner preferences persist per device via `localStorage` only; there are no accounts.

Charting choice:

- Recharts is used because it is common in React apps, lightweight enough for the PoC, works with responsive containers, and avoids custom SVG chart code for the first public UX slice.
- Charts are rendered only from client-loaded state in the existing mounted shell to avoid current-time or browser-only hydration mismatches.

### Future MQTT/Home Assistant Integration

Do not implement this in the MVP, but keep a clean boundary so the recommendation engine can later power:

- Home Assistant sensors
- MQTT topics
- local automations
- P1/digital meter peak detection

## First Vertical Slice

The first implementation should be:

external data fetch -> normalization -> scoring -> recommendation API -> frontend display

Avoid building platform features before this slice works.
