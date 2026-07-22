# Decisions

This file records product and technical decisions that should remain visible across future sessions.

## 2026-07-06: Decision-First UI Over Dashboard UI

Decision: The public frontend is a decision console, not a data dashboard. The visual hierarchy is: answer first (dark decision hero with the best window), a now-to-deadline timeline, a guided three-step planner (appliance tiles, priority segments, deadline presets), alternatives/avoid windows, and collapsible secondary sections for charts, the nerd table, and data sources.

Rationale: The MVP promise is "tell me when to run an appliance, and show me why". The previous layout presented status cards, forms, charts, and tables with equal weight, which read as a dashboard. Nerd data and disclaimers stay available (inspectability remains a product decision) but move behind disclosure sections. No backend or endpoint changes; scoring and copy honesty are unchanged.

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

Rationale: Elia `ods191` near-real-time CO2 was documented but returned zero records when validated on 2026-07-01. Elia `ods192` worked but was historical D-1 data and should not drive future recommendations.

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

## 2026-07-01: Public PoC Uses `poc.coolsnet.com`

Decision: Deploy StroomMoment publicly at `https://poc.coolsnet.com` as a stateless public PoC without authentication.

Rationale: The goal is early public validation, not a full production platform. The previous wall-screen PoC using this hostname can be replaced.

## 2026-07-01: Defer User Accounts And User Database

Decision: Do not add accounts, authentication, or a user database for the public PoC.

Rationale: The app currently does not need personal user data. Future accounts may be useful for saved preferences, tariffs, locations, or Home Assistant/P1 integrations, but they should not block deployment.

## 2026-07-01: Public PoC Keeps Persistent File Cache

Decision: Use a persistent host-mounted file cache for the backend on the public PoC.

Rationale: File cache is enough for the current public source data and keeps operations simple. SQLite, PostgreSQL, TimescaleDB, and InfluxDB remain future options if historical storage, querying, or user-specific data become important.

## 2026-07-01: Recharts for Public PoC Charts

Decision: Use Recharts for the first public PoC charting slice in the Next.js frontend.

Rationale: Recharts is a common React charting library, supports responsive line charts without custom SVG code, and is sufficient for price, PV/wind, load, and candidate score visualizations. Charts use already-normalized backend API responses and do not introduce browser-side external data calls.

## 2026-07-03: Public Errors Are Sanitized and Upstream Failures Are Negative-Cached

Decision: Public API 502 responses return a generic message with details logged server-side only, and Elia fetch failures are negative-cached for 90 seconds. Freshness errors expose only the exception class name.

Rationale: A public PoC must not leak upstream URLs or internals, and an Elia outage must not multiply into a paginated fetch fan-out for every visitor. Energy-Charts missing-day 404s were already negative-cached; this makes failure behavior consistent.

## 2026-07-03: Scores Are Explicitly Relative; Avoid-Windows Added

Decision: The UI states that scores compare today's feasible windows (100% = best available, not absolutely cheap/green), and recommendations include the three weakest feasible windows as informational avoid-windows when at least eight candidates exist.

Rationale: Min-max scaling within candidates is honest and robust but can over-claim on bad days without explicit copy. Avoid-windows complete the original MVP promise using existing scoring only.

## 2026-07-03: Planner Preferences Stay Client-Only

Decision: Saved planner preferences use `localStorage` per device. No accounts, authentication, or server-side user storage for the PoC.

Rationale: Preferences improve repeat use without creating any personal-data surface. Accounts remain deferred per DESIGN_NOTES.md.

## 2026-07-03: GitHub Is the Source-of-Truth Remote

Decision: Use `https://github.com/nicolascools/StroomMoment` as the source-of-truth Git remote for StroomMoment.

Rationale: The manual bundle workflow successfully bootstrapped the public PoC but leaves the deployed repo ahead of a stale `bundle-origin` remote. A GitHub remote gives the Windows development repo and Proxmox deployment host a shared source of truth. Manual bundles remain an emergency fallback only.
