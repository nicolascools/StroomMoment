# Roadmap

Last reviewed: 2026-07-01. This is directional sequencing, not a completion report. Current completion is unknown unless recorded in the dated [status](STATUS.md) or [app TODO](apps/stroommoment/TODO.md).

## Phase 0: API Validation and Workspace Setup

- Validate candidate Belgian/open data sources.
- Record API source notes and limitations.
- Create repository structure and durable documentation.
- Decide initial backend/frontend direction.

## Phase 1: Public Energy Signal and Recommendation MVP

- Fetch Belgian load, PV, wind, and optional price data.
- Normalize time-series data to `Europe/Brussels`.
- Generate first candidate windows for today/tomorrow.
- Expose a recommendation API.
- Build a public page that answers whether now is a good moment to use electricity.

## Phase 2: Appliance Planner and Data/Nerd View

- Add appliance type, duration, deadline, and optimization mode.
- Show best balanced, greenest, and cheapest windows when available.
- Add charts for CO2, solar, wind, load, and price when available.
- Add table of top candidate windows and score breakdown.
- Show raw API timestamps and freshness indicators.

## Phase 3: Dynamic Price Support and Custom Weights

- Add official ENTSO-E price support if feasible.
- Evaluate fallback or complementary price APIs.
- Add custom score weights for technical users.
- Add saved local appliance defaults if useful without accounts.

## Phase 4: P1, Home Assistant, and MQTT Integration

- Add local current-load ingestion options.
- Add P1 digital meter support through local integrations.
- Add Home Assistant and MQTT sensor output.
- Implement real peak-risk avoidance once personal consumption data exists.

## Phase 5: Home Data Wall and Kiosk Mode

- Create a display mode for wall screens and tablets.
- Combine energy, weather, air quality, public transport, waste calendar, and other local signals.
- Support passive glanceable views for the home.

## Phase 6: Reuse Infrastructure for House Futureproof Checker

- Reuse data-source, normalization, geospatial, and scoring concepts.
- Add house/address-level public data sources such as fibre/mobile coverage, flood risk, transport, and municipality statistics.

## Phase 7: Separate Professional KBO/CBE Market Mapper

- Build a separate B2B/professional data product.
- Use Belgian company registry and sector/location analysis.
- Keep separate from the consumer energy product unless shared infrastructure is clearly useful.
