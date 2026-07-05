"use client";

import type { ReactNode } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber, formatPriceShort, formatTime } from "../lib/format";
import type { ForecastPoint } from "../lib/types";

type SignalChartPoint = {
  time: string;
  label: string;
  price: number | null;
  pv: number | null;
  wind: number | null;
  renewable: number | null;
  load: number | null;
};

type ChartTooltipPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
};

function signalChartData(points: ForecastPoint[]): SignalChartPoint[] {
  return points.slice(0, 96).map((point) => ({
    time: point.timestamp_brussels,
    label: formatTime(point.timestamp_brussels),
    price: point.price_eur_mwh,
    pv: point.pv_forecast_mw,
    wind: point.wind_forecast_mw,
    renewable: point.renewable_forecast_mw,
    load: point.load_forecast_mw,
  }));
}

export function SignalCharts({ points }: { points: ForecastPoint[] }) {
  const data = signalChartData(points);
  if (!data.length) return null;
  return (
    <section className="charts-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow mini">Signals</p>
          <h2>What the recommendation sees</h2>
        </div>
        <p className="hint">Next 24 hours, 15-minute Belgian signals. Price is wholesale/day-ahead, not your exact tariff.</p>
      </div>
      <div className="chart-grid">
        <ChartPanel title="BE day-ahead price" subtitle="EUR/MWh, wholesale bidding-zone signal">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={28} />
              <YAxis width={58} tickFormatter={(value) => `${value}`} />
              <Tooltip content={<PriceTooltip />} />
              <Line type="monotone" dataKey="price" name="Price" stroke="#9b4d00" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="PV and wind forecast" subtitle="Elia Open Data forecasts in MW">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={28} />
              <YAxis width={58} tickFormatter={(value) => `${formatNumber(Number(value))}`} />
              <Tooltip content={<MwTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="pv" name="PV" stroke="#d09b00" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="wind" name="Wind" stroke="#2477a3" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="renewable" name="PV + wind" stroke="#1f7a4f" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Belgian load forecast" subtitle="Lower load windows score better in low-load mode">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={28} />
              <YAxis width={58} tickFormatter={(value) => `${formatNumber(Number(value))}`} />
              <Tooltip content={<MwTooltip />} />
              <Line type="monotone" dataKey="load" name="Load" stroke="#344b3f" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </section>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <article className="card chart-card">
      <div className="chart-title">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </article>
  );
}

function PriceTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const price = typeof value === "number" ? value : null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>{formatPriceShort(price)}</span>
      {price !== null ? <span>{(price / 1000).toFixed(3)} EUR/kWh equivalent</span> : null}
    </div>
  );
}

function MwTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={`${item.name}-${String(item.dataKey)}`}>{item.name}: {typeof item.value === "number" ? `${formatNumber(item.value)} MW` : "-"}</span>
      ))}
    </div>
  );
}
