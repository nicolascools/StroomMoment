# MVP Scope

The first MVP should be a public webapp that gives practical Belgian electricity timing recommendations without requiring login or personal hardware.

## In Scope

### Public Energy Status

- Show current Belgian energy status.
- Show whether now looks good, acceptable, or poor for flexible electricity usage.
- Show next best windows today and tomorrow.
- Show data freshness and source status.

### Appliance Planner

User can select:

- appliance type: dishwasher, washing machine, dryer, EV charging, boiler, heat pump, or custom
- duration in 15-minute increments, defaulted from the appliance profile
- optional or profile-default power in kW for energy and peak-risk context
- deadline: before tonight, before tomorrow morning, or custom date/time
- optimization mode: balanced, greenest, low-load, or cheapest when price data exists

### Recommendation Output

Show:

- best balanced window
- greenest window
- cheapest window if price data is available
- avoid windows
- short explanation such as high solar forecast, lower load, lower price, or possible peak risk
- estimated appliance energy and capacity-tariff note when power is known
- transparent score breakdown for candidate windows

### Data/Nerd View

Show:

- line or area chart for solar forecast
- line or area chart for wind forecast
- line chart for Belgian load forecast
- CO2 chart when a reliable CO2 source is available
- price chart when price data is available
- table of top candidate windows
- explanation of scoring weights
- raw API timestamp and data freshness indicator

## Out of Scope

- Authentication
- Billing or payments
- Full Home Assistant integration
- P1 live meter integration
- MQTT output
- Supplier-specific tariff formulas
- Real capacity-tariff peak calculation without P1/Home Assistant/live meter data
- Native mobile app
- Complex user profiles
- Multi-household account management
- Automated EV or appliance control

## MVP Success Test

The first MVP succeeds if a Belgian technical user can open the app, select "dishwasher, 2 hours, before tomorrow morning", receive useful recommended windows, and inspect the data behind the answer.
