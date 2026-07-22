# StroomMoment App

StroomMoment is a Belgian energy-timing webapp with one main promise:

> Tell me when to run an appliance, and show me why.

The app combines public grid, renewable, and optional day-ahead price signals with appliance-window scoring. It has no login or server-side user profile; saved planner preferences stay in browser `localStorage`.

## Documentation

- [MVP scope](MVP.md): intended public MVP capabilities.
- [Architecture](ARCHITECTURE.md): implemented boundaries and deferred infrastructure.
- [API sources](API_SOURCES.md): validated upstream sources and limitations.
- [Scoring model](SCORING_MODEL.md): candidate-window scoring and fallback weights.
- [Data model](DATA_MODEL.md): normalized API entities.
- [User stories](USER_STORIES.md): user needs and acceptance framing.
- [Design notes](DESIGN_NOTES.md): explicitly deferred roadmap options.
- [TODO](TODO.md): dated implementation backlog and recorded completion labels.
- [Notes](NOTES.md): dated research findings and unresolved questions.
- [Deployment](DEPLOYMENT.md): public PoC deployment and rollback procedures.

Workspace-wide context lives in the [root README](../../README.md), [status](../../STATUS.md), [memory](../../MEMORY.md), [decisions](../../DECISIONS.md), and [roadmap](../../ROADMAP.md).

## Implementation Map

- `backend/`: FastAPI API, public-source clients, file cache, normalization, scoring, and recommendations.
- `frontend/`: Next.js decision-console UI, planner, timeline, alternatives, charts, and nerd-data views.
- `docker-compose.yml`: optional local orchestration for backend, frontend, and the same-origin router.

Implemented API endpoints include `GET /health`, `GET /api/signals`, `GET /api/appliances`, and `GET /api/recommendations`.

## Run Locally

Commands below start from the workspace root.

Backend:

```bash
cd apps/stroommoment/backend
python -m venv .venv
.venv/bin/python -m pip install -e ".[dev]"
.venv/bin/python -m uvicorn app.main:app --reload
```

Backend tests:

```bash
cd apps/stroommoment/backend
.venv/bin/python -m pytest
```

Frontend:

```bash
cd apps/stroommoment/frontend
npm ci
npm run dev
```

Frontend build:

```bash
cd apps/stroommoment/frontend
npm run build
```

Optional Docker Compose:

```bash
cd apps/stroommoment
docker compose up --build
```

Open `http://localhost:3000` for direct development or `http://localhost:8080` for the Compose router. Direct frontend development can set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`; leave it blank for same-origin routing.

## Public PoC

The documented target is `https://poc.coolsnet.com` on `stroommoment-01`, with app root `/opt/stroommoment` and persistent cache `/var/lib/stroommoment/cache`. This documentation pass did not query the live host; see the dated [status checkpoint](../../STATUS.md) before treating those values or the deployment state as current.

Load, PV, and wind data are attributed to [Elia Open Data](https://opendata.elia.be/pages/home/). Price data is a wholesale/day-ahead BE bidding-zone signal from [Energy-Charts](https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE), not an exact household tariff.
