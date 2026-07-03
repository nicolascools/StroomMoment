# Belgian Open Data Apps Workspace

This workspace is for practical Belgian webapp ideas built around free and open public data sources. The goal is to turn small, useful ideas into demoable MVPs that can be tested by technical early users and extended over time.

The first active product is **StroomMoment**, a Belgian energy timing app that answers: "When should I use electricity?"

StroomMoment focuses on flexible electricity loads such as dishwashers, washing machines, dryers, EV charging, boilers, heat pumps, and custom appliances. It should combine simple recommendations with transparent underlying energy data.

Other Belgian open-data ideas are parked for later in `future-ideas/`. These include a House Futureproof Checker, KBO/CBE Market Mapper, Local Data Wall, Home Assistant Belgium Hub, and related data products.

## Repository Layout

- `apps/stroommoment/` contains the active first app planning documents.
- `future-ideas/` contains parked Belgian open-data product ideas.
- `MEMORY.md` stores durable project context for future sessions.
- `DECISIONS.md` records product and technical decisions.
- `ROADMAP.md` tracks the long-term phased direction.
- `AGENTS.md` defines how AI/code agents should work in this repository.

## Current Status

The workspace now contains the first working StroomMoment MVP slice:

- FastAPI backend for Elia/Energy-Charts fetching, caching, normalization, scoring, and recommendation APIs.
- Next.js frontend for Belgian energy status, appliance planning, recommendation output, and data tables.
- Project documentation for data sources, architecture, scoring, roadmap, and decisions.

## Local Development

Backend:

```powershell
cd C:\Projects\StroomMoment\apps\stroommoment\backend
.\.venv\Scripts\python.exe -m pytest
```

Frontend:

```powershell
cd C:\Projects\StroomMoment\apps\stroommoment\frontend
npm run build
```

## Git Hygiene

Generated files, dependency folders, local caches, virtual environments, build outputs, logs, and real `.env` files are ignored. Keep source, docs, lockfiles, Docker files, tests, and `.env.example` files tracked.

## Git Remote Workflow

The source-of-truth remote is `https://github.com/nicolascools/StroomMoment`.

Normal local flow:

```powershell
cd C:\Projects\StroomMoment
git status
git add .
git commit -m "Describe the change"
git push
```

The public PoC host should deploy by pulling from the same remote and rebuilding Docker Compose. Manual Git bundles are only an emergency fallback.
