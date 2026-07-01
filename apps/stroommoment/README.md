# StroomMoment

StroomMoment is a Belgian energy timing webapp.

Main promise:

> Tell me when to run an appliance, and show me why.

The product helps users decide when to run flexible electricity loads such as dishwashers, washing machines, dryers, EV charging, boilers, heat pumps, and custom appliances.

## Why This Exists

Belgian energy users increasingly deal with dynamic prices, renewable variability, digital meters, EV charging, solar production, and capacity tariff concerns. Most public energy dashboards show data, but they do not answer the practical question: should I start this load now, later today, or overnight?

StroomMoment should turn Belgian grid and energy signals into simple recommendations while still exposing the data behind them.

## Target MVP Users

- Belgian energy nerds
- Home Assistant users
- EV owners
- Solar owners
- People with digital meters
- People interested in dynamic tariffs
- People who want to understand the Belgian capacity tariff / `kwartierpiek`

## Public MVP Scope

- No login.
- Public Belgian energy status page.
- Appliance planner with type, duration, deadline, and optimization mode.
- Recommendation output with best windows and avoid windows.
- Nerd/data view with charts, freshness indicators, and scoring breakdown.
- Belgian timezone handling using `Europe/Brussels`.
- Initial capacity-tariff education and optional manual assumptions.

## Current Vertical Slice

The first working slice now exists under this directory:

- `backend/`: FastAPI API for Elia fetching, file caching, normalization, scoring, and recommendations
- `frontend/`: Next.js UI with status page, appliance planner, recommendation output, and data table
- `docker-compose.yml`: optional local orchestration for backend and frontend

Implemented data path:

```text
Elia Open Data -> backend cache -> normalized 15-minute points -> scoring -> API -> frontend
```

Implemented API endpoints:

- `GET /health`
- `GET /api/signals?hours=48`
- `GET /api/appliances`
- `GET /api/recommendations?appliance_id=dishwasher&duration_minutes=120&power_kw=1.2&deadline=2026-07-02T07:00&mode=balanced`

The appliance planner now uses backend profiles for default duration, assumed power, EV charging power options, estimated energy, and capacity-tariff context. Capacity-tariff notes are informational only until live household meter data exists.

## Data Sources and Attribution

- Load, PV, and wind forecasts come from [Elia Open Data](https://opendata.elia.be/pages/home/).
- Belgian day-ahead price data comes from [Energy-Charts](https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE).
- Price is a wholesale/day-ahead BE bidding-zone signal, not the user's exact supplier tariff.
- Actual electricity cost depends on the user's contract, supplier markup, taxes, grid fees, VAT, and other billing components.
- API responses expose per-source freshness metadata including fetch time, latest source timestamp, cache status, record count, source URL, and errors when a source is unavailable.

## Run Locally

Backend:

```powershell
cd C:\Projects\StroomMoment\apps\stroommoment\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

If the virtualenv does not exist yet:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

Frontend:

```powershell
cd C:\Projects\StroomMoment\apps\stroommoment\frontend
npm install
npm run dev
```

Open `http://localhost:3000` with the backend running on `http://localhost:8000`.

Optional Docker Compose:

```powershell
cd C:\Projects\StroomMoment\apps\stroommoment
docker compose up --build
```

The Compose stack exposes a local router on `http://localhost:8080` and keeps backend/frontend service ports internal.

## Deployment

The public Proxmox PoC deployment is documented in `DEPLOYMENT.md`.

Current target:

- public URL: `https://poc.coolsnet.com`
- app host: `stroommoment-01` at `192.168.1.47`
- app root: `/opt/stroommoment`
- persistent cache: `/var/lib/stroommoment/cache`

## Product Principle

The app should be useful in simple mode and trustworthy in nerd mode.

Simple mode answers: "What should I do?"

Nerd mode answers: "Why did the app recommend that?"
