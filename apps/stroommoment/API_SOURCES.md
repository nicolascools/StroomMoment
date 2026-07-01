# API Sources

Validation date: 2026-07-01.

This document tracks validated data sources for StroomMoment. A source is considered usable only when a real records request returned the fields needed for the MVP.

## Global API Notes

- Elia Open Data uses the Opendatasoft API at `https://opendata.elia.be/api/explore/v2.1/`.
- Elia dataset metadata endpoint: `https://opendata.elia.be/api/explore/v2.1/catalog/datasets/{dataset_id}`.
- Elia records endpoint: `https://opendata.elia.be/api/explore/v2.1/catalog/datasets/{dataset_id}/records`.
- Raw Elia API timestamps were validated as UTC strings such as `2026-07-05T21:45:00+00:00`.
- Elia catalog metadata says dataset timezone is `Europe/Brussels`; portal display may differ from API/download timestamps.
- Store timestamps as UTC internally and convert to `Europe/Brussels` for deadlines, display, and user-facing planning.
- All external calls must be server-side and cached. Do not call these APIs directly from browser clients.

## MVP Source Summary

| Need | Source | Dataset ID | MVP priority | Status |
| --- | --- | --- | --- | --- |
| Belgian load forecast | Elia Open Data | `ods002` | required | usable |
| Solar/PV forecast | Elia Open Data | `ods087` | required | usable |
| Wind forecast | Elia Open Data | `ods086` | required | usable |
| CO2 current/near-real-time | Elia Open Data | `ods191` | deferred | documented but currently empty |
| CO2 historical | Elia Open Data | `ods192` | useful | usable for historical/nerd view, not forecast |
| System imbalance | Elia Open Data | `ods169`, `ods136`, `ods147` | later | usable but not first scoring input |
| Elia price-like data | Elia Open Data | `ods162`, `ods155`, `ods168` | rejected/deferred | balancing/imbalance prices, not day-ahead household price |
| Day-ahead price | ENTSO-E | A44 API | deferred | official but token required |
| Day-ahead price signal | Energy-Charts | `/price?bzn=BE` | useful | implemented first price provider; unauthenticated, not Belgian official source |
| Weather | RMI/KMI Open Data | WFS layers | later | reachable, not needed for first MVP |
| Personal meter/peak | P1/Home Assistant | local integrations | later | needed for real peak safety |

## Required: Belgian Load Forecast

### Source Name

Elia Open Data.

### Dataset

- Dataset name: `Measured and forecasted total load on the Belgian grid (Near-real-time)`
- Dataset ID: `ods002`

### API Endpoint

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods002/records
```

### Example API Calls

Latest forecast horizon:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods002/records?select=datetime,resolutioncode,measured,mostrecentforecast,dayaheadforecast,weekaheadforecast&order_by=datetime%20desc&limit=2
```

Latest measured values:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods002/records?select=datetime,resolutioncode,measured,mostrecentforecast,dayaheadforecast,weekaheadforecast&where=measured%20is%20not%20null&order_by=datetime%20desc&limit=2
```

Example response snippet:

```json
{
  "datetime": "2026-07-05T21:45:00+00:00",
  "resolutioncode": "PT15M",
  "measured": null,
  "mostrecentforecast": 8164.78,
  "dayaheadforecast": 8164.78,
  "weekaheadforecast": 7879.22
}
```

### Authentication Needed

No.

### Timezone Behavior

Raw API timestamps are UTC. Convert to `Europe/Brussels` for display and deadlines.

### Timestamp Field Names

- `datetime`

### Important Value Field Names

- `measured`: measured and upscaled Belgian total load
- `mostrecentforecast`: most recent total load forecast
- `mostrecentconfidence10`: lower 80% confidence bound
- `mostrecentconfidence90`: upper 80% confidence bound
- `dayaheadforecast`: day-ahead total load forecast
- `dayaheadconfidence10`: day-ahead lower confidence bound
- `dayaheadconfidence90`: day-ahead upper confidence bound
- `weekaheadforecast`: week-ahead total load forecast

### Units

MW.

### Granularity

15 minutes, `resolutioncode = PT15M`.

### Update Frequency

Catalog metadata says `5 Minutes`.

### Reliability and Limitations

- Works without authentication.
- Contains measured values for recent past/current slots and forecasts for future slots.
- Future rows have `measured = null`.
- Use `mostrecentforecast` as the default planning field.
- This is the best MVP signal for "avoid busy grid moments".

### MVP Priority

Required.

## Required: Solar/PV Forecast

### Source Name

Elia Open Data.

### Dataset

- Dataset name: `Photovoltaic power production estimation and forecast on Belgian grid (Near real-time)`
- Dataset ID: `ods087`

### API Endpoint

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods087/records
```

### Example API Calls

Belgian aggregate forecast rows:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods087/records?select=datetime,resolutioncode,region,realtime,mostrecentforecast,dayahead11hforecast,dayaheadforecast,weekaheadforecast,monitoredcapacity&where=region%3D%22Belgium%22&order_by=datetime%20desc&limit=2
```

Latest measured/realtime Belgian PV values:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods087/records?select=datetime,resolutioncode,region,realtime,mostrecentforecast,dayaheadforecast&where=region%3D%22Belgium%22%20and%20realtime%20is%20not%20null&order_by=datetime%20desc&limit=2
```

Example response snippet:

```json
{
  "datetime": "2026-07-01T12:45:00+00:00",
  "resolutioncode": "PT15M",
  "region": "Belgium",
  "realtime": 5970.616,
  "mostrecentforecast": 5990.407,
  "dayaheadforecast": 5614.258
}
```

### Authentication Needed

No.

### Timezone Behavior

Raw API timestamps are UTC. Convert to `Europe/Brussels` for display and deadlines.

### Timestamp Field Names

- `datetime`

### Important Value Field Names

- `region`: use `Belgium` for national aggregate
- `realtime`: measured and upscaled PV generation
- `mostrecentforecast`: most recent PV forecast
- `mostrecentconfidence10`: lower 80% confidence bound
- `mostrecentconfidence90`: upper 80% confidence bound
- `dayahead11hforecast`: day-ahead forecast published at 11:00
- `dayaheadforecast`: day-ahead forecast published later, labelled as day-ahead 6 PM in historical schema
- `weekaheadforecast`: week-ahead PV forecast
- `monitoredcapacity`: monitored PV capacity

### Units

MW.

### Granularity

15 minutes, `resolutioncode = PT15M`.

### Update Frequency

Catalog metadata says `5 Minutes`.

### Reliability and Limitations

- Works without authentication.
- Use `region="Belgium"` for the national aggregate.
- Future rows have `realtime = null`.
- Nighttime values are expected to be `0.0`.
- Use `mostrecentforecast` as the default planning field.
- Historical dataset `ods032` exists but is not the correct MVP source for today/tomorrow planning.

### MVP Priority

Required.

## Required: Wind Forecast

### Source Name

Elia Open Data.

### Dataset

- Dataset name: `Wind power production estimation and forecast on Belgian grid (Near real-time)`
- Dataset ID: `ods086`

### API Endpoint

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods086/records
```

### Example API Calls

National aggregate forecast by timestamp:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods086/records?select=datetime%2Csum(mostrecentforecast)%20as%20wind_forecast_mw%2Csum(dayaheadforecast)%20as%20wind_dayahead_mw%2Csum(weekaheadforecast)%20as%20wind_weekahead_mw&group_by=datetime&order_by=datetime%20desc&limit=2
```

Onshore/offshore split:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods086/records?select=datetime%2Coffshoreonshore%2Csum(mostrecentforecast)%20as%20wind_forecast_mw&group_by=datetime%2Coffshoreonshore&order_by=datetime%20desc&limit=6
```

Raw rows showing dimensions:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods086/records?select=datetime,resolutioncode,offshoreonshore,region,gridconnectiontype,realtime,mostrecentforecast,dayaheadforecast,weekaheadforecast&order_by=datetime%20desc&limit=4
```

Example aggregate response snippet:

```json
{
  "datetime": "2026-07-07T21:45:00+00:00",
  "wind_forecast_mw": 447.3,
  "wind_dayahead_mw": 447.3,
  "wind_weekahead_mw": 141.3
}
```

Example onshore/offshore response snippet:

```json
{
  "datetime": "2026-07-07T21:45:00+00:00",
  "offshoreonshore": "Offshore",
  "wind_forecast_mw": 72.7
}
```

### Authentication Needed

No.

### Timezone Behavior

Raw API timestamps are UTC. Convert to `Europe/Brussels` for display and deadlines.

### Timestamp Field Names

- `datetime`

### Important Value Field Names

- `offshoreonshore`: `Onshore` or `Offshore`
- `region`: region such as `Flanders`, `Wallonia`, or `Federal`
- `gridconnectiontype`: `Elia` or `DSO`
- `realtime`: measured and upscaled wind generation
- `mostrecentforecast`: most recent wind forecast
- `mostrecentconfidence10`: lower 80% confidence bound
- `mostrecentconfidence90`: upper 80% confidence bound
- `dayahead11hforecast`: day-ahead forecast published at 11:00
- `dayaheadforecast`: day-ahead forecast
- `weekaheadforecast`: week-ahead wind forecast
- `monitoredcapacity`: monitored wind capacity

### Units

MW.

### Granularity

15 minutes, `resolutioncode = PT15M`.

### Update Frequency

Catalog metadata says `5 Minutes`.

### Reliability and Limitations

- Works without authentication.
- Unlike PV, there is no single `region="Belgium"` row in the validated sample.
- Aggregate by `datetime` using `sum(mostrecentforecast)` for national forecast.
- Keep onshore/offshore split if useful for nerd view.
- Future rows have `realtime = null`; do not treat summed null realtime as meaningful future actual generation.
- Historical dataset `ods031` exists but is not the correct MVP source for today/tomorrow planning.

### MVP Priority

Required.

## Useful but Not Required: CO2 Intensity

### Source Name

Elia Open Data / Green Grid Compass-published datasets in Elia portal.

### Near-Real-Time Dataset

- Dataset name: `Production-Based CO2 Intensity and Consumption-Based CO2 Intensity Belgium (Near real-time)`
- Dataset ID: `ods191`

### Historical Dataset

- Dataset name: `Production-Based CO2 Intensity and Consumption-Based CO2 Intensity Belgium (Historical)`
- Dataset ID: `ods192`

### API Endpoints

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods191/records
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods192/records
```

### Example API Calls

Near-real-time check:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods191/records?limit=2
```

Validated result on 2026-07-01:

```json
{
  "total_count": 0,
  "results": []
}
```

Historical latest values:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods192/records?select=datetime,production,consumption&order_by=datetime%20desc&limit=3
```

Example historical response snippet:

```json
{
  "datetime": "2026-06-30T18:00:00+00:00",
  "production": 287.34,
  "consumption": 206.107
}
```

### Authentication Needed

No for Elia Open Data endpoints.

### Timezone Behavior

Raw API timestamps are UTC. Convert to `Europe/Brussels` for display.

### Timestamp Field Names

- `datetime`

### Important Value Field Names

- `production`: production-based CO2 intensity; cross-border flows are not included
- `consumption`: consumption-based CO2 intensity; cross-border flows are included

### Units

gCO2eq/kWh.

### Granularity

1 hour.

### Update Frequency

- `ods191`: catalog describes current-day data refreshed every hour, but no records were returned during validation.
- `ods192`: catalog describes daily refresh, showing data until day-1.

### Reliability and Limitations

- `ods191` is documented but currently unusable because the records endpoint returned zero rows and catalog metadata reported `records=0`.
- `ods192` works but is historical and not suitable for future recommendation scoring.
- No public Elia CO2 forecast dataset was found in the catalog search.
- If CO2 is shown in MVP, label it clearly as unavailable for future scoring or historical/context-only.
- If a reliable near-real-time or forecast CO2 API becomes available later, prefer `consumption` for user-facing household timing because it accounts for cross-border flows.

### MVP Priority

Useful for transparency, but deferred as a required scoring input.

## Later/Nerd View: System Imbalance

### Source Name

Elia Open Data.

### Datasets

- `ods169`: `Current system imbalance (Near real-Time)`
- `ods136`: `System imbalance forecast current quarter hour (near real-time)`
- `ods147`: `System imbalance forecast next quarter hour (near real-time)`

### API Endpoints

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods169/records
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods136/records
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods147/records
```

### Example API Calls

Current system imbalance:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods169/records?select=datetime,resolutioncode,qualitystatus,systemimbalance,ace&order_by=datetime%20desc&limit=2
```

Current quarter-hour forecast:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods136/records?select=predictiontimeutc,resolutioncode,quality_status,predictions_forecastedtimeutc,predictionquality,predictions_silinearregressionforecast&order_by=predictiontimeutc%20desc&limit=2
```

Next quarter-hour forecast:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods147/records?select=predictiontimeutc,resolutioncode,quality_status,predictions_forecastedtimeutc,systemimbalanceforecastdatetime,predictionquality,predictions_silinearregressionforecast&order_by=predictiontimeutc%20desc&limit=2
```

### Authentication Needed

No.

### Timezone Behavior

Raw API timestamps are UTC.

### Timestamp Field Names

- `datetime` for `ods169`
- `predictiontimeutc`, `predictions_forecastedtimeutc`, and `systemimbalanceforecastdatetime` for forecast datasets

### Important Value Field Names

- `systemimbalance`: current system imbalance in MW
- `ace`: Area Control Error in MW
- `predictions_silinearregressionforecast`: forecasted system imbalance value
- `predictionquality`: quality indicator

### Units

MW for imbalance and ACE values.

### Granularity

1 minute for the checked imbalance datasets.

### Update Frequency

Catalog metadata says `Continuously` for the checked near-real-time datasets.

### Reliability and Limitations

- These datasets are usable, but they are balancing/operations signals rather than household-friendly planning signals.
- Not a clean proxy for "busy grid moments" over today/tomorrow.
- Do not use in the first scoring model unless a clear interpretation is added.

### MVP Priority

Later. Possible nerd view only.

## Rejected/Deferred for MVP Price: Elia Price-Like Data

### Source Name

Elia Open Data.

### Datasets Checked

- `ods162`: `Imbalance prices per quarter-hour (Near real-time)`
- `ods155`: `Available balancing energy prices per quarter hour in Belgium (Near-real-time)`
- `ods168`: `Balancing energy prices components per quarter-hour (Near real-time)`

### API Endpoints

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods162/records
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods155/records
```

### Example API Calls

Imbalance price:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods162/records?select=datetime,resolutioncode,qualitystatus,systemimbalance,marginalincrementalprice,marginaldecrementalprice,imbalanceprice&order_by=datetime%20desc&limit=3
```

Available balancing energy prices:

```text
https://opendata.elia.be/api/explore/v2.1/catalog/datasets/ods155/records?select=datetime,resolutioncode,upwardavailableafrrprice,upwardavailablemfrrprice,downwardavailableafrrprice,downwardavailablemfrrprice&order_by=datetime%20desc&limit=3
```

### Authentication Needed

No.

### Timezone Behavior

Raw API timestamps are UTC.

### Timestamp Field Names

- `datetime`

### Important Value Field Names

- `imbalanceprice`
- `marginalincrementalprice`
- `marginaldecrementalprice`
- `upwardavailableafrrprice`
- `upwardavailablemfrrprice`
- `downwardavailableafrrprice`
- `downwardavailablemfrrprice`

### Units

EUR/MWh in the dataset descriptions.

### Granularity

15 minutes.

### Update Frequency

- `ods162`: catalog says `Continuously`
- `ods155`: catalog says `Quarter Hour`

### Reliability and Limitations

- These are balancing and imbalance-market datasets.
- They are not the same as day-ahead wholesale prices and are not a clean first MVP signal for household timing.
- Do not use them as "cheap electricity" recommendations for v0.1.

### MVP Priority

Rejected/deferred for price optimization.

## Deferred: ENTSO-E Day-Ahead Prices

### Source Name

ENTSO-E Transparency Platform API.

### Dataset/API

Day-ahead prices use document type `A44`.

Belgium bidding zone domain used in validation:

```text
10YBE----------2
```

### API Endpoint

```text
https://web-api.tp.entsoe.eu/api
```

### Example API Call

Without token, validation returned `401`:

```text
https://web-api.tp.entsoe.eu/api?documentType=A44&in_Domain=10YBE----------2&out_Domain=10YBE----------2&periodStart=202607010000&periodEnd=202607020000
```

With token, expected shape is:

```text
https://web-api.tp.entsoe.eu/api?securityToken=TOKEN&documentType=A44&in_Domain=10YBE----------2&out_Domain=10YBE----------2&periodStart=YYYYMMDDHHMM&periodEnd=YYYYMMDDHHMM
```

### Authentication Needed

Yes. ENTSO-E security token required.

### Timezone Behavior

ENTSO-E period parameters are typically UTC-oriented API parameters. Confirm exact timestamp handling during implementation if this source is added.

### Timestamp Field Names

XML response structure must be parsed; not validated because no token is available.

### Important Value Field Names

Day-ahead price values in the XML time series.

### Units

Usually EUR/MWh.

### Granularity

Market-dependent; Belgium may expose 15-minute or hourly periods depending on date and API response.

### Update Frequency

Day-ahead publication cycle.

### Reliability and Limitations

- Official source but requires account/token setup.
- XML parsing and token handling add friction.
- Not required for v0.1 if it slows the MVP.

### MVP Priority

Deferred.

## Implemented: Energy-Charts Price API

### Source Name

Energy-Charts API.

### Source Link

```text
https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE
```

### API Endpoint

```text
https://api.energy-charts.info/price
```

### Example API Call

```text
https://api.energy-charts.info/price?bzn=BE&start=2026-07-01&end=2026-07-01
```

Example response shape:

```json
{
  "license_info": "CC BY 4.0 ...",
  "unix_seconds": [1782856800],
  "price": [164.42],
  "unit": "EUR / MWh",
  "deprecated": false
}
```

Validated behavior on 2026-07-01:

- `start=2026-07-01&end=2026-07-01` returned 96 points.
- First timestamp was `2026-06-30T22:00:00Z`, which is `2026-07-01 00:00 Europe/Brussels` during summer time.
- Step size was 900 seconds, so the BE response was quarter-hourly.
- `start=2026-07-02&end=2026-07-02` also returned 96 points, meaning tomorrow data was already available at validation time.
- `start=2026-07-03&end=2026-07-03` returned `404 Not Found`, so not-yet-available future days must be treated as missing price data.

### Authentication Needed

No.

### Timezone Behavior

Returns Unix seconds. Convert to UTC, then `Europe/Brussels` for display.

### Timestamp Field Names

- `unix_seconds`

### Important Value Field Names

- `price`
- `unit`
- `license_info`

### Units

EUR/MWh.

### Granularity

Validated response for BE returned 15-minute-spaced timestamps. The normalization layer still supports hourly-to-15-minute mapping for future providers.

### Update Frequency

Day-ahead price publication cycle.

### Reliability and Limitations

- Unauthenticated and easy to use.
- Not a Belgian official API.
- License attribution must be shown if used.
- Data is a wholesale/day-ahead BE bidding-zone signal, not a household's exact supplier tariff.
- Actual cost depends on the user's contract, supplier markup, taxes, grid fees, VAT, and other billing components.
- Missing future days can return `404` and must not break recommendations.
- Endpoint documentation notes stricter public rate limits; cache server-side.

### MVP Priority

Implemented as the first optional price provider.

## Later: RMI/KMI Open Data

### Source Name

RMI/KMI Open Data WFS.

### Dataset/API

Weather observation layers include:

- `aws:aws_10min`
- `aws:aws_1hour`
- `aws:aws_1day`
- `aws:aws_station`

### API Endpoint

```text
https://opendata.meteo.be/service/wfs
```

### Example API Calls

Capabilities:

```text
https://opendata.meteo.be/service/wfs?service=WFS&version=2.0.0&request=GetCapabilities
```

Latest hourly observation sample:

```text
https://opendata.meteo.be/service/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=aws:aws_1hour&count=1&sortBy=timestamp%20D&outputFormat=application/json
```

Example response fields:

```json
{
  "timestamp": "2026-07-01T13:00:00Z",
  "temp_dry_shelter_avg": 21.94,
  "wind_speed_10m": 4.26,
  "sun_duration": 52.33,
  "short_wave_from_sky_avg": 826.52
}
```

### Authentication Needed

No.

### Timezone Behavior

Example timestamps are UTC with `Z` suffix.

### Timestamp Field Names

- `timestamp`

### Important Value Field Names

- `temp_dry_shelter_avg`
- `wind_speed_10m`
- `wind_speed_avg_30m`
- `wind_gusts_speed`
- `sun_duration`
- `short_wave_from_sky_avg`
- `sun_int_avg`
- `humidity_rel_shelter_avg`
- `pressure`

### Units

Layer-specific. Confirm per WFS schema before implementation.

### Granularity

10 minutes, hourly, or daily depending on layer.

### Update Frequency

Dataset-specific.

### Reliability and Limitations

- Reachable without authentication.
- Useful for weather context and forecast-quality explanations.
- Not needed for the first recommendation engine because Elia provides direct PV/wind forecasts.

### MVP Priority

Later.

## Later: Fluvius/P1 and Home Assistant

### Source Name

Local P1 digital meter data and Home Assistant integrations.

### Dataset/API

No public MVP API. This should be a local integration later.

### Endpoint

TODO.

### Authentication Needed

Depends on local integration.

### Timezone Behavior

Normalize local readings to UTC internally and `Europe/Brussels` for display.

### Timestamp Field Names

Depends on integration.

### Important Value Field Names

- current household load
- 15-minute peak estimate
- monthly peak target
- import/export power
- optional local solar production

### Units

kW, kWh, and possibly A/V depending on meter data.

### Granularity

Near-live local readings, integration-dependent.

### Update Frequency

Integration-dependent.

### Reliability and Limitations

- Required for real capacity-tariff peak avoidance.
- Not suitable as a dependency for the public MVP.
- Start with manual/educational peak-risk handling instead.

### MVP Priority

Later.
