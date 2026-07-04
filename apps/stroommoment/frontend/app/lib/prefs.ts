// Client-only saved planner preferences. No accounts, no backend persistence.
// Only call these after mount; they touch window.localStorage.

export type PlannerPrefs = {
  applianceId?: string;
  mode?: string;
  durationMinutes?: number;
  powerKw?: string;
};

const STORAGE_KEY = "stroommoment.planner.v1";

export function loadPlannerPrefs(): PlannerPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PlannerPrefs;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function savePlannerPrefs(prefs: PlannerPrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage may be unavailable (private mode, quota); saved prefs are optional.
  }
}
