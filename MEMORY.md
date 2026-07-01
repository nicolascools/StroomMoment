# Project Memory

This file stores durable context for future agent sessions.

## User Context

- The user is based in Belgium.
- The user is technically strong and interested in homelab, Home Assistant, automation, and data projects.
- Initial testers are likely to be nerdy or tech-savvy users who enjoy transparent data and are willing to test early versions.
- The user values practical MVPs that can be built, demoed, tested, and extended.

## Product Context

- The first active app is **StroomMoment**.
- StroomMoment is a Belgian webapp that answers: "When should I use electricity?"
- The app should recommend good windows for flexible electricity loads such as dishwasher, washing machine, dryer, EV charging, boiler, heat pump, and custom loads.
- The app should give simple recommendations but also expose the underlying raw and derived data.
- The app should not be only a dashboard. The core value is decision support.
- Belgian-specific context matters, especially the Flanders capacity tariff / `kwartierpiek` logic.
- The current MVP uses static appliance profiles and optional/manual power assumptions for energy and peak-risk context; it does not calculate real household peaks without P1/Home Assistant data.

## Initial User Experience Goal

The app should be able to say things like:

- "Run the dishwasher between 13:15 and 15:15."
- "Avoid 18:00-20:00."
- "EV charging is better after 01:00."

It should also show why:

- lower CO2 intensity when available
- high solar forecast
- high wind forecast
- lower Belgian grid load
- lower price when price data exists
- possible peak/capacity-tariff risk

## Future Ideas

The following ideas are parked for later:

- House Futureproof Checker
- KBO/CBE Market Mapper
- Local Data Wall
- Home Assistant Belgium Hub
- Belgian commute reliability dashboard

## Working Principles

- Start narrow.
- Use public Belgian/open data first.
- Keep data sources and scoring transparent.
- Avoid login and user accounts in the first public MVP.
- Keep the architecture ready for future Home Assistant, P1, and MQTT integrations without implementing them too early.
