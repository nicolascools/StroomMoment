import type { ApplianceProfile, Recommendation, SignalSnapshot } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
export const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim() ?? "";

export const eliaOpenDataUrl = "https://opendata.elia.be/pages/home/";
export const energyChartsUrl = "https://www.energy-charts.info/charts/price_spot_market/chart.htm?l=en&c=BE";
export const energyChartsLicenseUrl = "https://creativecommons.org/licenses/by/4.0/";

export async function fetchSignals(hours = 48): Promise<SignalSnapshot> {
  const response = await fetch(`${API_BASE}/api/signals?hours=${hours}`);
  if (!response.ok) throw new Error(`Signals request failed: ${response.status}`);
  return (await response.json()) as SignalSnapshot;
}

export async function fetchAppliances(): Promise<ApplianceProfile[]> {
  const response = await fetch(`${API_BASE}/api/appliances`);
  if (!response.ok) throw new Error(`Appliances request failed: ${response.status}`);
  return (await response.json()) as ApplianceProfile[];
}

export type RecommendationRequest = {
  durationMinutes: number;
  deadline: string;
  mode: string;
  applianceId: string;
  powerKw: string;
};

export async function fetchRecommendation(request: RecommendationRequest): Promise<Recommendation> {
  const params = new URLSearchParams({
    duration_minutes: String(request.durationMinutes),
    deadline: request.deadline,
    mode: request.mode,
    appliance_id: request.applianceId,
  });
  if (request.powerKw.trim()) {
    params.set("power_kw", request.powerKw.trim());
  }
  const response = await fetch(`${API_BASE}/api/recommendations?${params.toString()}`);
  if (!response.ok) throw new Error(`Recommendation request failed: ${response.status}`);
  return (await response.json()) as Recommendation;
}
