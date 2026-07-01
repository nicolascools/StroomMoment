# Decisions

This file records product and technical decisions that should remain visible across future sessions.

## 2026-07-01: Focus First on StroomMoment

Decision: The first active product is the Belgian energy timing app, StroomMoment.

Rationale: It is practical, testable with technical early users, and fits Belgian open data plus homelab/Home Assistant interests.

## 2026-07-01: Public Webapp, No Login for MVP

Decision: The MVP starts as a public webapp with no authentication.

Rationale: Login, profiles, and account management would slow down validation. The first value is public recommendations and transparent data.

## 2026-07-01: Recommendations Plus Underlying Data

Decision: The app must show both simple instructions and the data/scoring behind them.

Rationale: Initial users are likely technical and will trust the product more if they can inspect the signals, freshness, and scoring breakdown.

## 2026-07-01: Defer Home Assistant, P1, and MQTT

Decision: Home Assistant, P1 digital meter ingestion, and MQTT sensors are later-phase integrations.

Rationale: These are highly relevant but would complicate the first public MVP. The first app should work without personal hardware or credentials.

## 2026-07-01: Defer Dynamic Price Complexity if It Slows MVP

Decision: Dynamic price support is valuable but should not block the first working version.

Rationale: ENTSO-E requires API token setup, and supplier-specific formulas add complexity. Price can be optional or use a simpler source first.

## 2026-07-01: Capacity Tariff Is a Differentiator, Initially Simplified

Decision: Capacity tariff / `kwartierpiek` should be treated as a key Belgian differentiator, but MVP handling starts with education and optional manual inputs.

Rationale: Real peak avoidance requires personal consumption data from P1, Home Assistant, or manual entry. The app should not pretend to know household peaks without that data.

## 2026-07-01: Required MVP Energy Sources Are Load, PV, and Wind

Decision: The first implementation should use Elia `ods002` for Belgian load, `ods087` for PV, and `ods086` for wind as the required data sources.

Rationale: These datasets are public, unauthenticated, validated with working records queries, and provide 15-minute forecast data suitable for today/tomorrow appliance timing.

## 2026-07-01: CO2 Is Not a Required MVP Scoring Input

Decision: CO2 should be treated as optional/context-only until a reliable current or forecast source is available.

Rationale: Elia `ods191` near-real-time CO2 is documented but currently returns zero records. Elia `ods192` works but is historical D-1 data and should not drive future recommendations.

## 2026-07-01: Official Price Complexity and Weather Are Deferred

Decision: Official ENTSO-E price support, supplier-specific tariff formulas, and RMI/KMI weather context should not block v0.1.

Rationale: ENTSO-E requires a token and XML parsing, Elia price-like datasets are balancing/imbalance prices rather than day-ahead household price signals, and weather is unnecessary while Elia provides direct PV/wind forecasts.

## 2026-07-01: First Slice Uses FastAPI, Next.js, and File Cache

Decision: The first working vertical slice uses FastAPI for the backend, Next.js for the frontend, and a simple server-side file cache for Elia responses.

Rationale: This provides the shortest path to a working data fetch -> normalization -> scoring -> API -> UI loop. SQLite remains a likely next upgrade for cache/snapshot storage, but file cache is enough for v0.1.

## 2026-07-01: Initial Scoring Started Without Price

Decision: The first implemented public MVP score used 45% renewable score, 35% low-load score, and 20% convenience score, with mode variants for renewable and low-load optimization.

Rationale: These were the first validated reliable signals from Elia. CO2 remains intentionally omitted until reliable current/forecast CO2 data is added.

## 2026-07-01: Energy-Charts Is the First Price Provider

Decision: Use Energy-Charts `/price?bzn=BE` as the first pluggable day-ahead price provider.

Rationale: The endpoint is unauthenticated, returns BE bidding-zone day-ahead prices in EUR/MWh, and validated daily BE responses returned 96 quarter-hour points. ENTSO-E remains the official later option but requires token setup and XML parsing.

## 2026-07-01: Price Is a Signal, Not Exact Household Tariff

Decision: Price data in StroomMoment is labelled as a wholesale/day-ahead bidding-zone signal, not the user's exact electricity bill price.

Rationale: Supplier-specific tariff formulas, taxes, fees, dynamic contract rules, and household-specific billing details are out of scope for this MVP.

## 2026-07-01: Price-Aware Scoring When Available

Decision: Balanced scoring uses price when available: 35% price, 25% renewable, 20% low-load, and 20% convenience. Without price, it falls back to 45% renewable, 35% low-load, and 20% convenience.

Rationale: Price is valuable but optional. Recommendations must continue working when price data is missing or not yet published.

## 2026-07-01: Static Appliance Profiles for MVP

Decision: The MVP uses a backend-owned static appliance catalog for default duration, assumed power, power options, and capacity-tariff notes.

Rationale: This makes the appliance planner real without adding accounts, personal profiles, P1 ingestion, or false precision about household peaks. Power assumptions are informational and can be overridden by the user.
