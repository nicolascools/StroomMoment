# User Stories

## Public User

- As a user, I can open the app and see whether now is a good moment to use electricity.
- As a user, I can see the next good windows today and tomorrow.
- As a user, I can choose "dishwasher, 2 hours, before tomorrow morning" and get recommended start windows.
- As a user, I can see windows I should avoid, such as evening peak periods.
- As a user, I can understand the recommendation in plain language.

## Technical User

- As a technical user, I can inspect the data behind the recommendation.
- As a technical user, I can see how the score was calculated.
- As a technical user, I can see API freshness and missing-data warnings.
- As a technical user, I can compare balanced, greenest, and cheapest recommendations.
- As a technical user, I can see a table of candidate windows and component scores.

## Belgian Energy User

- As a Belgian user, I can understand how the recommendation relates to Belgian load, solar, wind, and capacity-tariff concerns.
- As a user with a digital meter, I can understand why starting a high-power load might affect my `kwartierpiek`.
- As an EV owner, I can find a better charging window before a deadline.
- As a solar owner, I can see when Belgian PV production is forecast to be high, even if the app does not yet know my local production.

## Future Home Assistant User

- As a future Home Assistant user, I can imagine how this recommendation becomes a sensor or automation source.
- As a future Home Assistant user, I want a later integration that can answer "safe to start now?" based on local load and public grid signals.
