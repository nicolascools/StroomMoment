# Ideas

## Active Idea: StroomMoment / When Should I Use Electricity?

Belgian energy timing app that recommends when to run flexible electricity loads.

Why interesting:

- Directly useful for Belgian households.
- Uses open energy data.
- Fits dynamic tariffs, solar, EV charging, and digital-meter concerns.
- Has a clear nerd/data mode for early technical users.
- Can later integrate with Home Assistant, P1 meters, and MQTT.

## Parked: Belgian Commute Reliability Dashboard

Dashboard and planner that answers when to leave to avoid public transport delays.

Why interesting:

- Belgian commute reliability is a real daily pain.
- Potential data sources include iRail, De Lijn, NMBS/SNCB, Belgian Mobility, and local disruption feeds.
- Could become a useful daily tool.

Why parked:

- Less aligned with the current homelab/energy/Home Assistant direction.

## Parked: House Futureproof Checker

Checker for whether a Belgian house/location is futureproof.

Why interesting:

- Useful when buying a house.
- Could combine BIPT/fibre/mobile coverage, public transport, Statbel, flood/geospatial data, energy context, and local services.
- Strong long-term reuse of data infrastructure.

Why parked:

- Broader data integration challenge than StroomMoment.

## Parked: KBO/CBE Market Mapper

Professional tool for mapping Belgian companies by sector, location, age, NACE code, and market signals.

Why interesting:

- Potential B2B value.
- Useful for consulting, sales, market research, and local economic analysis.

Why parked:

- Different audience and business model from the first consumer/energy MVP.

## Parked: Local Life Dashboard / Data Wall

Glanceable home screen showing local Belgian signals such as energy, weather, air quality, public transport, and waste calendar.

Why interesting:

- Strong fit for tablets, wall screens, and homelab setups.
- Could reuse StroomMoment energy signals.

Why parked:

- Better as a later display layer after core energy data and recommendations work.

## Parked: Home Assistant Belgium Integration Hub

Integration hub exposing Belgian grid, energy, weather, air quality, transport, and other public signals as Home Assistant/MQTT sensors.

Why interesting:

- Strong fit for the user's interests and likely early users.
- Could turn recommendations into automations.

Why parked:

- First MVP should be a normal public webapp before becoming an automation backend.
