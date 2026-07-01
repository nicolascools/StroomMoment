# Home Assistant Belgium Hub

## Concept

A Belgian integration hub that exposes public Belgian data sources as Home Assistant entities and MQTT topics.

Possible entities:

- Belgian grid load forecast
- solar and wind forecast
- energy timing recommendation
- safe-to-start-now signal
- day-ahead price
- CO2 intensity when reliable
- local weather and air quality
- transport disruptions

## Why It Is Interesting

- Strong fit for technical early users.
- Turns StroomMoment recommendations into automations.
- Makes Belgian public data usable in homelab setups.
- Could support EV charging, boiler, dishwasher, and washing-machine automations.

## Likely APIs and Data Sources

- StroomMoment backend API
- Elia Open Data
- Energy-Charts or ENTSO-E prices
- RMI/KMI Open Data
- Home Assistant REST/WebSocket APIs
- MQTT broker
- P1 digital meter data via local integrations

## Relationship to StroomMoment

This is a natural extension of StroomMoment. The same scoring engine can later produce Home Assistant sensors and MQTT topics.

## Why It Is Parked for Now

The first MVP should validate the recommendation logic in a normal public webapp. Home Assistant, P1, and MQTT introduce local deployment and integration complexity that should wait until the core signal is useful.
