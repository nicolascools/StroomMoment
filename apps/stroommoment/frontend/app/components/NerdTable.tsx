import { formatDateTime, formatNumber, formatPrice, scorePercent } from "../lib/format";
import type { ForecastPoint } from "../lib/types";

export function NerdTable({ points }: { points: ForecastPoint[] }) {
  if (!points.length) return null;
  return (
    <section className="card">
      <h2>Nerd Data View</h2>
      <p>Upcoming normalized 15-minute points from Elia. Times are shown in Europe/Brussels.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Load forecast</th>
              <th>PV forecast</th>
              <th>Wind forecast</th>
              <th>PV + wind</th>
              <th>Renewable/load</th>
              <th>Price</th>
              <th>Price score</th>
            </tr>
          </thead>
          <tbody>
            {points.slice(0, 48).map((point) => (
              <tr key={point.timestamp_brussels}>
                <td>{formatDateTime(point.timestamp_brussels)}</td>
                <td>{formatNumber(point.load_forecast_mw)} MW</td>
                <td>{formatNumber(point.pv_forecast_mw)} MW</td>
                <td>{formatNumber(point.wind_forecast_mw)} MW</td>
                <td>{formatNumber(point.renewable_forecast_mw)} MW</td>
                <td>{point.renewable_share_of_load ? scorePercent(point.renewable_share_of_load) : "-"}</td>
                <td>{formatPrice(point.price_eur_mwh)}</td>
                <td>{point.price_score !== null ? scorePercent(point.price_score) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
