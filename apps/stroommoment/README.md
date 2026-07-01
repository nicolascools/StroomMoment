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

## Product Principle

The app should be useful in simple mode and trustworthy in nerd mode.

Simple mode answers: "What should I do?"

Nerd mode answers: "Why did the app recommend that?"
