"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim() ?? "";

type Freshness = {
  source: string;
  display_name: string | null;
  source_url: string | null;
  fetched_at_utc: string | null;
  expires_at_utc: string | null;
  latest_timestamp_utc: string | null;
  latest_timestamp_brussels: string | null;
  cached: boolean;
  record_count: number;
  error: string | null;
};

type ForecastPoint = {
  timestamp_utc: string;
  timestamp_brussels: string;
  load_forecast_mw: number | null;
  pv_forecast_mw: number | null;
  wind_forecast_mw: number | null;
  renewable_forecast_mw: number | null;
  renewable_share_of_load: number | null;
  price_eur_mwh: number | null;
  price_score: number | null;
  price_provider: string | null;
};

type SignalSnapshot = {
  generated_at_brussels: string;
  points: ForecastPoint[];
  freshness: Freshness[];
};

type CandidateWindow = {
  start_brussels: string;
  end_brussels: string;
  score: {
    total: number;
    renewable_score: number;
    low_load_score: number;
    convenience_score: number;
    price_score: number | null;
    weights: Record<string, number>;
  };
  average_load_mw: number | null;
  average_renewable_mw: number | null;
  average_renewable_share_of_load: number | null;
  average_price_eur_mwh: number | null;
  price_provider: string | null;
  explanations: string[];
};

type ApplianceProfile = {
  id: string;
  label: string;
  default_duration_minutes: number;
  default_power_kw: number | null;
  power_options_kw: number[] | null;
  peak_relevance: string;
  short_description: string;
  peak_explanation: string;
};

type ApplianceImpact = {
  appliance_id: string;
  label: string;
  assumed_power_kw: number | null;
  estimated_energy_kwh: number | null;
  peak_relevance: string;
  peak_note: string;
  capacity_tariff_note: string;
};

type Recommendation = {
  duration_minutes: number;
  deadline_brussels: string;
  mode: string;
  appliance: ApplianceProfile | null;
  appliance_impact: ApplianceImpact | null;
  best_window: CandidateWindow | null;
  top_windows: CandidateWindow[];
  freshness: Freshness[];
  warnings: string[];
};

const defaultApplianceId = "dishwasher";
const modes = ["balanced", "renewable", "low_load", "cheapest"];
const eliaOpenDataUrl = "https://opendata.elia.be/pages/home/";
const energyChartsUrl = "https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE";

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-BE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  }).format(new Date(value));
}

function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-BE", { maximumFractionDigits: digits }).format(value);
}

function defaultDeadlineBrussels() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Brussels",
    year: "numeric",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const brusselsTodayUtc = Date.UTC(Number(lookup.year), Number(lookup.month) - 1, Number(lookup.day));
  const brusselsTomorrow = new Date(brusselsTodayUtc + 24 * 60 * 60 * 1000);
  return `${brusselsTomorrow.getUTCFullYear()}-${String(brusselsTomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(brusselsTomorrow.getUTCDate()).padStart(2, "0")}T07:00`;
}

function scorePercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

function formatPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  const eurKwh = value / 1000;
  return `${formatNumber(value, 2)} EUR/MWh (${eurKwh.toFixed(3)} EUR/kWh)`;
}

function formatPriceShort(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${formatNumber(value, 0)} EUR/MWh`;
}

function formatOptionalDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "unknown";
}

function formatKw(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "unknown";
  return `${formatNumber(value, 1)} kW`;
}

function formatKwh(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "unknown";
  return `${formatNumber(value, 2)} kWh`;
}

function defaultPowerValue(profile: ApplianceProfile) {
  return profile.default_power_kw === null ? "" : String(profile.default_power_kw);
}

function freshnessStatus(item: Freshness) {
  if (item.error || item.record_count === 0) return "unavailable";
  if (item.expires_at_utc && new Date(item.expires_at_utc).getTime() < Date.now()) return "stale";
  return item.cached ? "cached" : "fresh";
}

function hasFreshnessWarning(items: Freshness[]) {
  return items.some((item) => ["stale", "unavailable"].includes(freshnessStatus(item)));
}

function latestFreshnessTimestamp(items: Freshness[]) {
  const timestamps = items
    .map((item) => item.latest_timestamp_brussels ?? item.latest_timestamp_utc)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return timestamps[0] ?? null;
}

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

function windowLabel(window: CandidateWindow) {
  return `${formatTime(window.start_brussels)}-${formatTime(window.end_brussels)}`;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [signals, setSignals] = useState<SignalSnapshot | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [applianceProfiles, setApplianceProfiles] = useState<ApplianceProfile[]>([]);
  const [applianceId, setApplianceId] = useState(defaultApplianceId);
  const [duration, setDuration] = useState(120);
  const [powerKw, setPowerKw] = useState("1.2");
  const [deadline, setDeadline] = useState("");
  const [mode, setMode] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedProfile = applianceProfiles.find((profile) => profile.id === applianceId) ?? null;

  async function loadSignals() {
    const response = await fetch(`${API_BASE}/api/signals?hours=48`);
    if (!response.ok) throw new Error(`Signals request failed: ${response.status}`);
    const data = (await response.json()) as SignalSnapshot;
    setSignals(data);
  }

  async function loadAppliances() {
    const response = await fetch(`${API_BASE}/api/appliances`);
    if (!response.ok) throw new Error(`Appliances request failed: ${response.status}`);
    const data = (await response.json()) as ApplianceProfile[];
    setApplianceProfiles(data);
    return data;
  }

  async function loadRecommendation(
    nextDuration = duration,
    nextDeadline = deadline,
    nextMode = mode,
    nextApplianceId = applianceId,
    nextPowerKw = powerKw,
  ) {
    const params = new URLSearchParams({
      duration_minutes: String(nextDuration),
      deadline: nextDeadline,
      mode: nextMode,
      appliance_id: nextApplianceId,
    });
    if (nextPowerKw.trim()) {
      params.set("power_kw", nextPowerKw.trim());
    }
    const response = await fetch(`${API_BASE}/api/recommendations?${params.toString()}`);
    if (!response.ok) throw new Error(`Recommendation request failed: ${response.status}`);
    const data = (await response.json()) as Recommendation;
    setRecommendation(data);
  }

  function onApplianceChange(nextApplianceId: string) {
    const profile = applianceProfiles.find((item) => item.id === nextApplianceId);
    setApplianceId(nextApplianceId);
    if (!profile) return;
    setDuration(profile.default_duration_minutes);
    setPowerKw(defaultPowerValue(profile));
  }

  useEffect(() => {
    async function load() {
      const initialDeadline = defaultDeadlineBrussels();
      setMounted(true);
      setDeadline(initialDeadline);
      try {
        setLoading(true);
        setError(null);
        const [, profiles] = await Promise.all([loadSignals(), loadAppliances()]);
        const initialProfile = profiles.find((profile) => profile.id === defaultApplianceId) ?? profiles[0] ?? null;
        const initialApplianceId = initialProfile?.id ?? defaultApplianceId;
        const initialDuration = initialProfile?.default_duration_minutes ?? 120;
        const initialPowerKw = initialProfile ? defaultPowerValue(initialProfile) : "1.2";
        setApplianceId(initialApplianceId);
        setDuration(initialDuration);
        setPowerKw(initialPowerKw);
        await loadRecommendation(initialDuration, initialDeadline, "balanced", initialApplianceId, initialPowerKw);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await loadRecommendation(duration, deadline, mode, applianceId, powerKw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const currentPoint = signals?.points[0];
  const priceAvailable = signals?.points.some((point) => point.price_eur_mwh !== null) ?? false;
  const activeFreshness = recommendation?.freshness.length ? recommendation.freshness : signals?.freshness ?? [];
  const latestDataTimestamp = latestFreshnessTimestamp(activeFreshness);
  const freshnessWarning = hasFreshnessWarning(activeFreshness);

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">StroomMoment MVP</p>
        <h1>When should I use electricity?</h1>
        <p className="lead">Choose better times to run flexible electricity loads in Belgium.</p>
      </section>

      <section className="card intro-card">
        <div>
          <h2>Public PoC</h2>
          <p>
            Pick an appliance and deadline. StroomMoment recommends a window using Belgian load, PV/wind forecasts, and day-ahead price signals from public/available sources.
          </p>
          <p className="hint">It does not know your contract, exact tariff, household load, or P1 meter yet. Personal savings and real peak avoidance need that data later.</p>
        </div>
        <FeedbackBlock />
      </section>

      {!mounted ? (
        <section className="card stable-shell">
          <h2>Preparing planner</h2>
          <p className="hint">Initializing Brussels-local defaults before loading Elia and price data.</p>
        </section>
      ) : null}

      {mounted && error ? <div className="error">{error}</div> : null}

      {mounted ? <section className="grid two">
        <article className="card status-card">
          <h2>Belgian Energy Status</h2>
          {loading && !signals ? <p>Loading Elia data...</p> : null}
          {currentPoint ? (
            <div className="metrics">
              <div>
                <span>Next point</span>
                <strong>{formatDateTime(currentPoint.timestamp_brussels)}</strong>
              </div>
              <div>
                <span>Load</span>
                <strong>{formatNumber(currentPoint.load_forecast_mw)} MW</strong>
              </div>
              <div>
                <span>PV + wind</span>
                <strong>{formatNumber(currentPoint.renewable_forecast_mw)} MW</strong>
              </div>
              <div>
                <span>Renewable/load</span>
                <strong>{currentPoint.renewable_share_of_load ? scorePercent(currentPoint.renewable_share_of_load) : "-"}</strong>
              </div>
              <div>
                <span>BE day-ahead price</span>
                <strong>{formatPrice(currentPoint.price_eur_mwh)}</strong>
              </div>
            </div>
          ) : null}
          {latestDataTimestamp ? <p className="hint">Latest source timestamp: {formatDateTime(latestDataTimestamp)}.</p> : null}
          {freshnessWarning ? <p className="warning">Some source data is stale or unavailable. Check Data Freshness below.</p> : null}
          <p className="hint">Price is a wholesale/day-ahead BE bidding-zone signal, not your exact supplier tariff.</p>
        </article>

        <article className="card">
          <RecommendationSummary recommendation={recommendation} freshnessWarning={freshnessWarning} />
        </article>
      </section> : null}

      {mounted ? <section className="card">
        <h2>Appliance Planner</h2>
        <form className="planner" onSubmit={onSubmit}>
          <label>
            Appliance
            <select value={applianceId} onChange={(event) => onApplianceChange(event.target.value)}>
              {applianceProfiles.length === 0 ? <option value={applianceId}>Loading profiles...</option> : null}
              {applianceProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.label}</option>
              ))}
            </select>
          </label>
          <label>
            Duration (min)
            <input type="number" min={15} max={24 * 60} step={15} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
          <label>
            Power (kW)
            {selectedProfile?.power_options_kw?.length ? (
              <select value={powerKw} onChange={(event) => setPowerKw(event.target.value)}>
                {selectedProfile.power_options_kw.map((item) => (
                  <option key={item} value={String(item)}>{item} kW</option>
                ))}
              </select>
            ) : (
              <input type="number" min={0.1} max={22} step={0.1} value={powerKw} onChange={(event) => setPowerKw(event.target.value)} placeholder="optional" />
            )}
          </label>
          <label>
            Deadline
            <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
          <label>
            Optimization
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              {modes.map((item) => (
                <option key={item} value={item}>{item.replace("_", " ")}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading || !deadline || duration < 15}>{loading ? "Calculating..." : "Find best window"}</button>
        </form>
        {selectedProfile ? <p className="hint">{selectedProfile.short_description}</p> : null}
        <p className="hint">Appliance power is used for estimated energy and capacity-tariff context; it does not change the score yet.</p>
        <p className={priceAvailable ? "hint" : "warning"}>{priceAvailable ? "Price data is available for at least part of the planning horizon." : "Price data unavailable; recommendations fall back to renewable/load/convenience scoring."}</p>
        <p className="hint">Price uses Energy-Charts BE day-ahead wholesale data in EUR/MWh. Actual cost depends on your contract, supplier markup, taxes, grid fees, VAT, and other billing terms.</p>
        {recommendation?.appliance_impact ? <ApplianceImpactSummary impact={recommendation.appliance_impact} /> : null}
      </section> : null}

      {signals ? <SignalCharts points={signals.points} /> : null}

      {recommendation?.top_windows.length ? <CandidateWindowBars windows={recommendation.top_windows} /> : null}

      {recommendation ? (
        <section className="grid two">
          <article className="card">
            <h2>Peak Note</h2>
            {recommendation.appliance_impact ? <ApplianceImpactSummary impact={recommendation.appliance_impact} compact /> : <p className="hint">Select an appliance with power data to see capacity-tariff context.</p>}
            {recommendation.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
          </article>
          <article className="card">
            <h2>Data Freshness</h2>
            <DataFreshnessList freshness={recommendation.freshness} />
          </article>
        </section>
      ) : null}

      {recommendation?.top_windows.length ? (
        <section className="card">
          <h2>Top 5 Candidate Windows</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Total</th>
                  <th>Renewable</th>
                  <th>Low load</th>
                  <th>Avg load</th>
                  <th>Avg PV+wind</th>
                  <th>Avg price</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                {recommendation.top_windows.map((window) => (
                  <tr key={`${window.start_brussels}-${window.end_brussels}`}>
                    <td>{formatDateTime(window.start_brussels)}</td>
                    <td>{formatDateTime(window.end_brussels)}</td>
                    <td>{scorePercent(window.score.total)}</td>
                    <td>{scorePercent(window.score.renewable_score)}</td>
                    <td>{scorePercent(window.score.low_load_score)}</td>
                    <td>{formatNumber(window.average_load_mw)} MW</td>
                    <td>{formatNumber(window.average_renewable_mw)} MW</td>
                    <td>{formatPrice(window.average_price_eur_mwh)}</td>
                    <td>{window.explanations.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {signals ? (
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
                {signals.points.slice(0, 48).map((point) => (
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
      ) : null}

      {mounted ? <DataSources freshness={activeFreshness} /> : null}
    </main>
  );
}

function FeedbackBlock() {
  return (
    <div className="feedback-card">
      <strong>Tester feedback</strong>
      <p>Spot confusing advice, stale data, or weird appliance assumptions?</p>
      {FEEDBACK_URL ? (
        <a className="button-link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Send feedback</a>
      ) : (
        <p className="hint">Feedback channel coming soon.</p>
      )}
    </div>
  );
}

function RecommendationSummary({ recommendation, freshnessWarning }: { recommendation: Recommendation | null; freshnessWarning: boolean }) {
  const window = recommendation?.best_window;
  if (!recommendation || !window) {
    return (
      <div className="recommendation-summary">
        <h2>Best Recommendation</h2>
        <p>No feasible recommendation yet. Adjust the appliance, duration, or deadline and calculate again.</p>
      </div>
    );
  }

  const priceContributed = window.score.price_score !== null && (window.score.weights.price_score ?? 0) > 0;
  const applianceImpact = recommendation.appliance_impact;

  return (
    <div className="recommendation-summary">
      <p className="eyebrow mini">Best window</p>
      <h2>{formatTime(window.start_brussels)}-{formatTime(window.end_brussels)}</h2>
      <p>
        {recommendation.appliance?.label ?? "Selected load"}, {recommendation.duration_minutes} minutes before {formatDateTime(recommendation.deadline_brussels)}.
      </p>
      <div className="score-grid">
        <span>Total {scorePercent(window.score.total)}</span>
        {window.score.price_score !== null ? <span>Price {scorePercent(window.score.price_score)}</span> : null}
        <span>Renewable {scorePercent(window.score.renewable_score)}</span>
        <span>Low load {scorePercent(window.score.low_load_score)}</span>
        <span>Convenience {scorePercent(window.score.convenience_score)}</span>
      </div>
      <h3>Why this window</h3>
      <ul className="reason-list">
        {window.explanations.map((explanation) => <li key={explanation}>{explanation}</li>)}
        <li>{priceContributed ? "Price data contributed to the score." : "Price data did not drive this recommendation."}</li>
        <li>{window.average_renewable_share_of_load !== null ? `PV/wind forecast covers about ${scorePercent(window.average_renewable_share_of_load)} of Belgian load in this window.` : "Renewable-share data is incomplete for this window."}</li>
        <li>{window.average_load_mw !== null ? `Belgian load forecast averages ${formatNumber(window.average_load_mw)} MW.` : "Belgian load data is incomplete for this window."}</li>
        <li>{freshnessWarning ? "Some source data is stale or unavailable; check the freshness panel." : "Source freshness looks usable for this recommendation."}</li>
      </ul>
      {applianceImpact ? (
        <p className="peak-note">
          Peak note: assumed power is {formatKw(applianceImpact.assumed_power_kw)}. Without P1/live meter data, StroomMoment cannot know your real monthly peak. Avoid combining this with EV charging, cooking, boiler, dryer, or other large loads.
        </p>
      ) : null}
    </div>
  );
}

function SignalCharts({ points }: { points: ForecastPoint[] }) {
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

function CandidateWindowBars({ windows }: { windows: CandidateWindow[] }) {
  return (
    <section className="card candidates-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow mini">Top windows</p>
          <h2>Score breakdown</h2>
        </div>
        <p className="hint">The top five candidate windows ranked by the active optimization mode.</p>
      </div>
      <div className="candidate-list">
        {windows.map((window) => (
          <article className="candidate-bar" key={`${window.start_brussels}-${window.end_brussels}`}>
            <div className="candidate-main">
              <strong>{windowLabel(window)}</strong>
              <span>{scorePercent(window.score.total)} total</span>
            </div>
            <div className="bar-track" aria-label={`Total score ${scorePercent(window.score.total)}`}>
              <div className="bar-fill" style={{ width: scorePercent(window.score.total) }} />
            </div>
            <div className="component-bars">
              {window.score.price_score !== null ? <ScoreMiniBar label="Price" value={window.score.price_score} /> : null}
              <ScoreMiniBar label="Renewable" value={window.score.renewable_score} />
              <ScoreMiniBar label="Low load" value={window.score.low_load_score} />
              <ScoreMiniBar label="Convenience" value={window.score.convenience_score} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScoreMiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mini-bar">
      <span>{label}</span>
      <div><i style={{ width: scorePercent(value) }} /></div>
      <b>{scorePercent(value)}</b>
    </div>
  );
}

function DataFreshnessList({ freshness }: { freshness: Freshness[] }) {
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

function DataSources({ freshness }: { freshness: Freshness[] }) {
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
            Belgian day-ahead prices come from <a href={energyChartsUrl} target="_blank" rel="noreferrer">Energy-Charts</a>. This is a wholesale BE bidding-zone signal, not your exact supplier tariff. Your actual cost depends on contract terms, markup, taxes, grid fees, VAT, and other billing components.
          </p>
        </div>
      </div>
      <DataFreshnessList freshness={freshness} />
    </section>
  );
}

function ApplianceImpactSummary({ impact, compact = false }: { impact: ApplianceImpact; compact?: boolean }) {
  return (
    <div className="impact-card">
      <strong>{impact.label} impact</strong>
      <div className="score-grid">
        <span>Power {formatKw(impact.assumed_power_kw)}</span>
        <span>Energy {formatKwh(impact.estimated_energy_kwh)}</span>
        <span>Peak relevance {impact.peak_relevance}</span>
      </div>
      <p>{impact.peak_note}</p>
      {!compact ? <p className="hint">{impact.capacity_tariff_note}</p> : null}
    </div>
  );
}

function BestWindow({ window }: { window: CandidateWindow | null }) {
  if (!window) return <p>No feasible recommendation yet.</p>;
  return (
    <div className="best-window">
      <strong>{formatDateTime(window.start_brussels)} - {formatDateTime(window.end_brussels)}</strong>
      <span>Score {scorePercent(window.score.total)}</span>
      <div className="score-grid">
        {window.score.price_score !== null ? <span>Price {scorePercent(window.score.price_score)}</span> : null}
        <span>Renewable {scorePercent(window.score.renewable_score)}</span>
        <span>Low load {scorePercent(window.score.low_load_score)}</span>
        <span>Convenience {scorePercent(window.score.convenience_score)}</span>
      </div>
      {window.average_price_eur_mwh !== null ? <p>Average day-ahead price: {formatPrice(window.average_price_eur_mwh)}</p> : null}
      <p>{window.explanations.join(". ")}.</p>
    </div>
  );
}
