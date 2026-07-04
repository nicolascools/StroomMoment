import type { ApplianceProfile, CandidateWindow, Freshness } from "./types";

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-BE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  }).format(new Date(value));
}

export function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-BE", { maximumFractionDigits: digits }).format(value);
}

export function formatPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  const eurKwh = value / 1000;
  return `${formatNumber(value, 2)} EUR/MWh (${eurKwh.toFixed(3)} EUR/kWh)`;
}

export function formatPriceShort(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${formatNumber(value, 0)} EUR/MWh`;
}

export function formatOptionalDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "unknown";
}

export function formatKw(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "unknown";
  return `${formatNumber(value, 1)} kW`;
}

export function formatKwh(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "unknown";
  return `${formatNumber(value, 2)} kWh`;
}

export function scorePercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function windowLabel(window: CandidateWindow) {
  return `${formatTime(window.start_brussels)}-${formatTime(window.end_brussels)}`;
}

export function defaultPowerValue(profile: ApplianceProfile) {
  return profile.default_power_kw === null ? "" : String(profile.default_power_kw);
}

export function defaultDeadlineBrussels() {
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

export function freshnessStatus(item: Freshness) {
  if (item.error || item.record_count === 0) return "unavailable";
  if (item.expires_at_utc && new Date(item.expires_at_utc).getTime() < Date.now()) return "stale";
  return item.cached ? "cached" : "fresh";
}

export function hasFreshnessWarning(items: Freshness[]) {
  return items.some((item) => ["stale", "unavailable"].includes(freshnessStatus(item)));
}

export function latestFreshnessTimestamp(items: Freshness[]) {
  const timestamps = items
    .map((item) => item.latest_timestamp_brussels ?? item.latest_timestamp_utc)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return timestamps[0] ?? null;
}
