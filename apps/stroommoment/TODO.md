# TODO

## Documentation and Validation

- Completed: validate Elia datasets for load, PV, wind, CO2, imbalance, and price-like data.
- Completed: validate API access patterns and query parameters for required Elia sources.
- Completed: confirm practical forecast horizons for load, PV, and wind.
- Completed: document that Elia `ods191` near-real-time CO2 currently returns zero records.
- Completed: document that price should not block v0.1.
- Recheck Elia `ods191` CO2 before implementing a public CO2 chart.
- Completed: decide Energy-Charts is acceptable as the first optional wholesale/day-ahead price signal.
- Decide later when ENTSO-E token setup is worth the effort.
- Completed: validate Energy-Charts BE day-ahead price endpoint and missing future-day behavior.

## Architecture Decisions

- Completed: confirm frontend stack as Next.js for the first slice.
- Completed: use file cache for the first slice; keep SQLite as the next cache/snapshot upgrade if needed.
- Completed: define backend module boundaries for API client, normalization, scoring, services, and routes.
- Completed: define normalized time-series format as `ForecastPoint` with UTC and Europe/Brussels timestamps.

## First Implementation Slice

- Completed: implement first Elia data fetcher for `ods002`, `ods087`, and `ods086`.
- Completed: add server-side file cache.
- Completed: normalize raw UTC time series and expose `Europe/Brussels` display times.
- Completed: aggregate wind by `datetime` using `sum(mostrecentforecast)`.
- Completed: filter PV to `region="Belgium"`.
- Completed: use `mostrecentforecast` as the default planning field for load, PV, and wind.
- Completed: appliance dropdown uses backend profiles with appliance-specific duration and power defaults.
- Completed: implement scoring prototype using renewable and load scores first.
- Completed: omit CO2 from current scoring; price is included when Energy-Charts data is available.
- Completed: build first recommendation endpoint.
- Completed: build first frontend screen.
- Completed: add data table.
- Completed: package with optional Docker Compose.

## Next Implementation Tasks

- Completed: add Energy-Charts as first pluggable price provider.
- Completed: add `cheapest` optimization mode.
- Completed: add price fields to signals, recommendations, and nerd table.
- Completed: add appliance-specific default durations and assumed power values.
- Completed: add user-facing capacity-tariff explanation to the UI.
- Completed: add lightweight Recharts panels for price, PV/wind, load, and top candidate score breakdowns.
- Completed: add loading skeletons and better empty/error states.
- Completed: sanitize public API errors and negative-cache Elia failures.
- Completed: add avoid-windows output and relative-score copy.
- Completed: client-only saved planner preferences via localStorage.
- Deferred: backend container non-root user; verify cache-mount ownership on the host first (see DESIGN_NOTES.md).
- Completed: add source attribution text for Elia Open Data.
- Completed: add Energy-Charts attribution text in the UI before public release.
- Consider switching cache to SQLite if file cache becomes hard to inspect.

## Product Follow-Up

- Completed: write first user-facing capacity-tariff explanation.
- Completed: add missing-data and stale-data UI states, skeletons, and no-feasible-window guidance.
- Completed: add source attribution and licensing notes.
- Test with a few real appliance scenarios.
- Add real tester feedback destination when the public PoC audience is known.
- Completed: add public favicon/icon metadata and robots.txt.

## Public PoC Deployment Follow-Up

- Completed: document the public `poc.coolsnet.com` deployment path.
- Completed: keep the public PoC stateless with no accounts, no authentication, and no user database.
- Completed: keep persistent backend cache as a file cache for now.
- Completed: create and configure local GitHub remote for `https://github.com/nicolascools/StroomMoment`.
- Configure `/opt/stroommoment` on `stroommoment-01` to replace `bundle-origin` with the GitHub remote.
- Consider SQLite, PostgreSQL, TimescaleDB, or InfluxDB only after the PoC shows a concrete need for history, analytics, or user-specific state.
- Consider CI/CD later with GitHub/Gitea and versioned Docker images.
