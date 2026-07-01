# House Futureproof Checker

## Concept

A Belgian location checker that helps answer whether a house or apartment is futureproof. It would combine infrastructure, mobility, environmental, demographic, and energy-context data for a specific address or area.

## Why It Is Interesting

- Useful when buying or comparing houses.
- Combines many Belgian public-data signals into one practical decision-support tool.
- Could reveal risks and strengths that are hard to see from real estate listings.
- Natural fit for a technical user who likes data-backed decisions.

## Likely APIs and Data Sources

- BIPT fibre and mobile coverage data
- public transport data from NMBS/SNCB, iRail, De Lijn, TEC, STIB/MIVB
- Statbel demographics and municipality data
- flood and geospatial risk data
- energy/grid context reused from StroomMoment
- RMI/KMI weather and climate-related data
- regional open data portals

## Relationship to StroomMoment

StroomMoment can provide reusable infrastructure for API clients, normalization, scoring, documentation discipline, and Belgian energy context. A future checker could reuse parts of the energy/weather stack.

## Why It Is Parked for Now

It is broader and more geospatially complex than the energy timing MVP. StroomMoment has a narrower first use case and clearer early-user testing path.
