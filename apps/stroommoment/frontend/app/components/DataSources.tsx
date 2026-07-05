import { eliaOpenDataUrl, energyChartsLicenseUrl, energyChartsUrl } from "../lib/api";
import { formatOptionalDateTime, freshnessStatus } from "../lib/format";
import type { Freshness } from "../lib/types";

export function DataSources({ freshness }: { freshness: Freshness[] }) {
  return (
    <section className="card data-sources">
      <h2>Data Sources</h2>
      <div className="source-grid">
        <div>
          <strong>Grid and renewable forecasts</strong>
          <p>
            Load, PV, and wind forecasts come from <a href={eliaOpenDataUrl} target="_blank" rel="noreferrer">Elia Open Data</a>.
          </p>
        </div>
        <div>
          <strong>Price signal</strong>
          <p>
            Belgian day-ahead prices come from <a href={energyChartsUrl} target="_blank" rel="noreferrer">Energy-Charts</a> (data licensed <a href={energyChartsLicenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>). This is a wholesale BE bidding-zone signal, not your exact supplier tariff. Your actual cost depends on contract terms, markup, taxes, grid fees, VAT, and other billing components.
          </p>
        </div>
      </div>
      <DataFreshnessList freshness={freshness} />
    </section>
  );
}

export function DataFreshnessList({ freshness }: { freshness: Freshness[] }) {
  if (!freshness.length) return <p className="hint">No source freshness metadata available yet.</p>;
  return (
    <ul className="freshness">
      {freshness.map((item) => {
        const status = freshnessStatus(item);
        const title = item.display_name ?? item.source;
        return (
          <li key={item.source}>
            <div className="freshness-heading">
              {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{title}</a> : <strong>{title}</strong>}
              <span className={`status-pill ${status}`}>{status}</span>
            </div>
            <div className="freshness-meta">
              <span>Fetched {formatOptionalDateTime(item.fetched_at_utc)}</span>
              <span>Latest data {formatOptionalDateTime(item.latest_timestamp_brussels ?? item.latest_timestamp_utc)}</span>
              <span>{item.record_count} records</span>
            </div>
            {item.error ? <p className="warning">{item.error}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
