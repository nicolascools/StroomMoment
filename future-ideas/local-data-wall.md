# Local Data Wall

## Concept

A home dashboard or kiosk display showing useful Belgian local signals on a wall screen, tablet, or always-on monitor.

Possible signals:

- electricity timing recommendations
- current grid/renewable status
- local weather
- air quality
- public transport disruptions
- waste calendar
- commute signals
- household automation status

## Why It Is Interesting

- Strong fit for homelab and Home Assistant users.
- Good always-on companion for the StroomMoment energy signal.
- Makes public and local data glanceable instead of buried in apps.
- Could be useful for households, home offices, and nerdy wall screens.

## Likely APIs and Data Sources

- StroomMoment recommendation API
- Elia energy data
- RMI/KMI weather data
- Belgian air quality sources such as IRCELINE/CELINE
- public transport APIs such as iRail and De Lijn
- local waste calendar sources where available
- Home Assistant local APIs later

## Relationship to StroomMoment

This can reuse StroomMoment energy signals and recommendation output. StroomMoment should first produce reliable energy timing data; the data wall can become a later display mode.

## Why It Is Parked for Now

It is mainly a presentation layer. It becomes more valuable after the core StroomMoment data and recommendation APIs exist.
