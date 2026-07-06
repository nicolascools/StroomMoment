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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function brusselsParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Brussels",
    year: "numeric",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    day: Number(lookup.day),
    hour: Number(lookup.hour === "24" ? "0" : lookup.hour),
    minute: Number(lookup.minute),
    month: Number(lookup.month),
    year: Number(lookup.year),
  };
}

function brusselsDateString(date: Date) {
  const parts = brusselsParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

// Wall-clock deadline value (datetime-local format) for a Brussels day offset + hour.
export function brusselsDeadlineValue(dayOffset: number, hour: number, minute = 0) {
  const today = brusselsParts();
  const base = new Date(Date.UTC(today.year, today.month - 1, today.day) + dayOffset * 24 * 60 * 60 * 1000);
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(hour)}:${pad(minute)}`;
}

// Current Brussels wall-clock time in datetime-local format, for lexical comparison with deadline values.
export function brusselsNowValue() {
  const now = brusselsParts();
  return `${now.year}-${pad(now.month)}-${pad(now.day)}T${pad(now.hour)}:${pad(now.minute)}`;
}

export function defaultDeadlineBrussels() {
  return brusselsDeadlineValue(1, 7);
}

export type DeadlinePreset = { label: string; value: string };

// Client-only: compares against current Brussels wall-clock time.
export function deadlinePresets(): DeadlinePreset[] {
  const now = brusselsNowValue();
  const presets: DeadlinePreset[] = [];
  const tonight = brusselsDeadlineValue(0, 23);
  if (tonight > now) presets.push({ label: "Tonight 23:00", value: tonight });
  presets.push({ label: "Tomorrow 07:00", value: brusselsDeadlineValue(1, 7) });
  presets.push({ label: "Tomorrow 18:00", value: brusselsDeadlineValue(1, 18) });
  return presets;
}

// Client-only: "Today", "Tomorrow", or a weekday label, in Brussels time.
export function dayLabel(value: string) {
  const target = brusselsDateString(new Date(value));
  const today = brusselsDateString(new Date());
  const tomorrow = brusselsDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  if (target === today) return "Today";
  if (target === tomorrow) return "Tomorrow";
  return new Intl.DateTimeFormat("en-BE", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Brussels",
    weekday: "long",
  }).format(new Date(value));
}

// Client-only: human "starts in" copy relative to now.
export function startsInLabel(startIso: string) {
  const minutes = Math.round((new Date(startIso).getTime() - Date.now()) / 60000);
  if (minutes <= 2) return "You can start now";
  if (minutes < 90) return `Starts in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Starts in about ${hours} h`;
}

const MODE_LABELS: Record<string, string> = {
  balanced: "Balanced",
  cheapest: "Cheapest",
  low_load: "Quiet grid",
  renewable: "Greenest",
};

export function modeLabel(mode: string) {
  return MODE_LABELS[mode] ?? mode.replace("_", " ");
}

export function freshnessStatus(item: Freshness) {
  if (item.error || item.record_count === 0) return "unavailable";
  if (item.expires_at_utc && new Date(item.expires_at_utc).getTime() < Date.now()) return "stale";
  return item.cached ? "cached" : "fresh";
}

export function hasFreshnessWarning(items: Freshness[]) {
  return items.some((item) => ["stale", "unavailable"].includes(freshnessStatus(item)));
}

