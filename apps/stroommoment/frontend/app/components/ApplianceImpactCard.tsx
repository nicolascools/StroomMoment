import { formatKw, formatKwh } from "../lib/format";
import type { ApplianceImpact } from "../lib/types";

// Canonical peak / capacity-tariff note. Rendered once per page.
export function ApplianceImpactCard({ impact }: { impact: ApplianceImpact }) {
  return (
    <section className="card impact-section">
      <h2>Peak &amp; capacity tariff (kwartierpiek)</h2>
      <div className="score-grid">
        <span>Power {formatKw(impact.assumed_power_kw)}</span>
        <span>Energy {formatKwh(impact.estimated_energy_kwh)}</span>
        <span>Peak relevance {impact.peak_relevance}</span>
      </div>
      <p>{impact.peak_note}</p>
      <p className="hint">{impact.capacity_tariff_note}</p>
    </section>
  );
}
