import { formatDateTime, formatNumber, formatPrice, scorePercent } from "../lib/format";
import type { ForecastPoint } from "../lib/types";

type Props = {
  point: ForecastPoint | undefined;
  loading: boolean;
  latestDataTimestamp: string | null;
  freshnessWarning: boolean;
};

export function EnergyStatusCard({ point, loading, latestDataTimestamp, freshnessWarning }: Props) {
  return (
    <article className="card status-card">
      <h2>Belgian Energy Status</h2>
      {loading && !point ? <p>Loading Elia data...</p> : null}
      {!loading && !point ? <p className="warning">Belgian signal data could not be loaded right now. Try again in a few minutes.</p> : null}
      {point ? (
        <div className="metrics">
          <div>
            <span>Next point</span>
            <strong>{formatDateTime(point.timestamp_brussels)}</strong>
          </div>
          <div>
            <span>Load</span>
            <strong>{formatNumber(point.load_forecast_mw)} MW</strong>
          </div>
          <div>
            <span>PV + wind</span>
            <strong>{formatNumber(point.renewable_forecast_mw)} MW</strong>
          </div>
          <div>
            <span>Renewable/load</span>
            <strong>{point.renewable_share_of_load ? scorePercent(point.renewable_share_of_load) : "-"}</strong>
          </div>
          <div>
            <span>BE day-ahead price</span>
            <strong>{formatPrice(point.price_eur_mwh)}</strong>
          </div>
        </div>
      ) : null}
      {latestDataTimestamp ? <p className="hint">Latest source timestamp: {formatDateTime(latestDataTimestamp)}.</p> : null}
      {freshnessWarning ? <p className="warning">Some source data is stale or unavailable. Check Data Sources below.</p> : null}
    </article>
  );
}
