# Agent Instructions

Inherits the kernel (`agent-os` repo). This repository is intended to be used over many sessions with AI/code agents. Preserve context and make small, deliberate changes.

## Core Rules

- Preserve project context. Read `README.md`, `MEMORY.md`, `DECISIONS.md`, and the relevant app docs before making significant changes.
- Update `MEMORY.md` when durable background context changes.
- Update `DECISIONS.md` when an architectural, product, scope, or data-source decision is made.
- Keep documentation current when implementation details change.
- Do not over-engineer the MVP.
- Prefer small vertical slices over broad platform work.
- Avoid authentication, payments, complex user profiles, or multi-tenant features until explicitly requested.
- Keep Belgian timezone handling in mind: normalize and present time using `Europe/Brussels`.
- Separate API clients, data normalization, scoring, recommendation APIs, and frontend logic.
- Cache external API calls and do not hammer public APIs.
- Treat public data sources as unreliable: handle missing fields, stale data, downtime, and rate limits.
- Keep the MVP useful even when optional data sources such as prices or CO2 intensity are unavailable.

## StroomMoment Implementation Direction

- Backend should be Python FastAPI unless a later decision changes this.
- Frontend should be Next.js unless a later decision changes this.
- Keep the implemented file cache for the public PoC; consider SQLite for cache inspection or snapshots only when needed.
- Use Docker Compose for local development and later deployment.
- Keep future Home Assistant, P1 meter, and MQTT support in mind, but do not implement them in the public MVP.

## Documentation Discipline

When adding or changing behavior:

- Add or update app-level docs in `apps/stroommoment/`.
- Keep `TODO.md` focused on concrete next tasks.
- Keep `NOTES.md` for rough research and unresolved questions.
- Move important resolved notes into `DECISIONS.md` or the relevant architecture/scoring/API document.

## Repository Hygiene

- Do not commit dependency folders, generated build outputs, caches, virtualenvs, logs, or real `.env` files.
- Keep `.env.example` files current when new configuration variables are introduced.
- Before committing, inspect `git status`, `git diff`, and recent log entries; stage only intended source, docs, config, lockfiles, and tests.
- Run relevant backend tests and frontend builds for touched apps before committing when practical.
- Push normal work to `origin/master` on `https://github.com/nicolascools/StroomMoment` when explicitly asked to publish or deploy.
- Public PoC deployment should pull from the GitHub remote on `stroommoment-01`; do not use manual Git bundles except as an emergency fallback.

## MVP Bias

The first useful product should answer a simple question:

> Tell me when to run an appliance, and show me why.

If a change does not support that promise, defer it unless explicitly requested.
