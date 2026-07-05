export type Freshness = {
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

export type ForecastPoint = {
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

export type SignalSnapshot = {
  generated_at_brussels: string;
  points: ForecastPoint[];
  freshness: Freshness[];
};

export type ScoreBreakdown = {
  total: number;
  renewable_score: number;
  low_load_score: number;
  convenience_score: number;
  price_score: number | null;
  weights: Record<string, number>;
};

export type CandidateWindow = {
  start_utc: string;
  end_utc: string;
  start_brussels: string;
  end_brussels: string;
  score: ScoreBreakdown;
  average_load_mw: number | null;
  average_renewable_mw: number | null;
  average_renewable_share_of_load: number | null;
  average_price_eur_mwh: number | null;
  price_provider: string | null;
  explanations: string[];
};

export type ApplianceProfile = {
  id: string;
  label: string;
  default_duration_minutes: number;
  default_power_kw: number | null;
  power_options_kw: number[] | null;
  peak_relevance: string;
  short_description: string;
  peak_explanation: string;
};

export type ApplianceImpact = {
  appliance_id: string;
  label: string;
  assumed_power_kw: number | null;
  estimated_energy_kwh: number | null;
  peak_relevance: string;
  peak_note: string;
  capacity_tariff_note: string;
};

export type Recommendation = {
  duration_minutes: number;
  deadline_brussels: string;
  mode: string;
  appliance: ApplianceProfile | null;
  appliance_impact: ApplianceImpact | null;
  best_window: CandidateWindow | null;
  top_windows: CandidateWindow[];
  avoid_windows: CandidateWindow[];
  freshness: Freshness[];
  warnings: string[];
};
