# Conceptual Data Model

This document is implementation-neutral. It describes the concepts the app should model, not a final database schema.

## EnergySignal

Represents the current or summarized Belgian energy status.

Fields:

- timestamp
- status label: good, acceptable, poor, unknown
- short recommendation text
- current load
- current solar
- current wind
- current price if available
- current CO2 if available
- data freshness metadata

## ForecastPoint

Represents one normalized time-series point, usually at 15-minute granularity.

Fields:

- timestamp UTC
- timestamp Europe/Brussels
- load forecast MW
- load measured MW if available
- solar forecast MW
- solar measured MW if available
- wind forecast MW
- wind measured MW if available
- renewable share estimate
- day-ahead price in EUR/MWh if available
- price score if available
- price provider if available
- CO2 intensity if available
- source/freshness metadata

## PricePoint

Represents one normalized price point from a pluggable price provider.

Fields:

- timestamp UTC
- timestamp Europe/Brussels
- price EUR/MWh
- provider
- source name
- fetched timestamp

Current provider:

- Energy-Charts BE day-ahead price API

Important note:

- This is a wholesale/day-ahead bidding-zone signal, not the user's exact supplier tariff.

## SourceFreshness

Represents source attribution and freshness for one upstream data feed.

Fields:

- source id
- display name
- source URL
- fetched timestamp UTC
- cache expiry timestamp UTC
- latest source data timestamp UTC
- latest source data timestamp Europe/Brussels
- cached flag
- record count
- error text when unavailable

Current usage:

- Elia Open Data load, PV, and wind forecast feeds expose dataset links and latest `datetime` values.
- Energy-Charts price freshness exposes the latest price timestamp and source link.

## ApplianceProfile

Represents appliance defaults and assumptions.

Fields:

- `id`
- `label`
- `default_duration_minutes`
- `default_power_kw`
- `power_options_kw` for appliances with common fixed choices, such as EV charging
- `peak_relevance`
- `short_description`
- `peak_explanation`

Example appliance types:

- dishwasher
- washing machine
- dryer
- EV charging
- boiler
- heat pump
- custom

## CandidateWindow

Represents one possible start/end window for an appliance run.

Fields:

- start time
- end time
- duration
- included forecast points
- average load
- average solar
- average wind
- average renewable share
- average CO2 if available
- average price if available
- price provider if available
- score breakdown
- explanation strings

## Recommendation

Represents the result returned to the user.

Fields:

- selected appliance
- requested duration
- appliance impact summary when an appliance profile is selected
- deadline
- optimization mode
- best balanced window
- greenest window
- cheapest window if available
- avoid windows
- candidate window table
- source freshness summary
- warnings or missing-data notes

## ApplianceImpact

Represents informational appliance impact for the selected profile and entered power.

Fields:

- appliance id
- label
- assumed power kW if known
- estimated energy kWh if power is known
- peak relevance label
- peak note
- capacity tariff note

Important note:

- This is not a real household `kwartierpiek` calculation. Without live meter/P1 data, the app can only explain peak-risk context and warn against stacking high-power loads.

## ScoreBreakdown

Represents transparent scoring for a candidate window.

Fields:

- total score
- CO2 score
- renewable score
- load score
- price score
- convenience score
- peak-safety score when real household load data exists later
- weights used
- metrics omitted because data was unavailable
- explanation text
