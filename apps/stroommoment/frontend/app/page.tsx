"use client";

import { type FormEvent, useEffect, useState } from "react";

import { AppliancePlanner } from "./components/AppliancePlanner";
import { ApplianceImpactCard } from "./components/ApplianceImpactCard";
import { CandidateWindows } from "./components/CandidateWindows";
import { DataSources } from "./components/DataSources";
import { EnergyStatusCard } from "./components/EnergyStatusCard";
import { FeedbackBlock } from "./components/FeedbackBlock";
import { NerdTable } from "./components/NerdTable";
import { RecommendationSummary } from "./components/RecommendationSummary";
import { SignalCharts } from "./components/SignalCharts";
import { SkeletonCard, SkeletonPlanner } from "./components/Skeletons";
import { fetchAppliances, fetchRecommendation, fetchSignals } from "./lib/api";
import { defaultDeadlineBrussels, defaultPowerValue, hasFreshnessWarning, latestFreshnessTimestamp } from "./lib/format";
import { loadPlannerPrefs, savePlannerPrefs } from "./lib/prefs";
import type { ApplianceProfile, Recommendation, SignalSnapshot } from "./lib/types";

const defaultApplianceId = "dishwasher";
const modes = ["balanced", "renewable", "low_load", "cheapest"];

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
      const prefs = loadPlannerPrefs();
      try {
        setLoading(true);
        setError(null);
        const [signalData, profiles] = await Promise.all([fetchSignals(48), fetchAppliances()]);
        setSignals(signalData);
        setApplianceProfiles(profiles);

        const preferredProfile = profiles.find((profile) => profile.id === prefs.applianceId) ?? null;
        const initialProfile = preferredProfile ?? profiles.find((profile) => profile.id === defaultApplianceId) ?? profiles[0] ?? null;
        const initialApplianceId = initialProfile?.id ?? defaultApplianceId;
        const savedDuration = prefs.durationMinutes;
        const initialDuration =
          preferredProfile && typeof savedDuration === "number" && savedDuration >= 15 && savedDuration <= 24 * 60
            ? savedDuration
            : initialProfile?.default_duration_minutes ?? 120;
        const initialPowerKw =
          preferredProfile && typeof prefs.powerKw === "string"
            ? prefs.powerKw
            : initialProfile
              ? defaultPowerValue(initialProfile)
              : "1.2";
        const initialMode = prefs.mode && modes.includes(prefs.mode) ? prefs.mode : "balanced";

        setApplianceId(initialApplianceId);
        setDuration(initialDuration);
        setPowerKw(initialPowerKw);
        setMode(initialMode);

        const recommendationData = await fetchRecommendation({
          durationMinutes: initialDuration,
          deadline: initialDeadline,
          mode: initialMode,
          applianceId: initialApplianceId,
          powerKw: initialPowerKw,
        });
        setRecommendation(recommendationData);
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
    savePlannerPrefs({ applianceId, mode, durationMinutes: duration, powerKw });
    try {
      setLoading(true);
      setError(null);
      const recommendationData = await fetchRecommendation({
        durationMinutes: duration,
        deadline,
        mode,
        applianceId,
        powerKw,
      });
      setRecommendation(recommendationData);
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
  const initialLoading = loading && !signals && !recommendation;

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

      {mounted && initialLoading ? (
        <>
          <SkeletonPlanner />
          <SkeletonCard lines={4} />
        </>
      ) : null}

      {mounted && !initialLoading ? (
        <>
          <section className="grid two">
            <EnergyStatusCard
              point={currentPoint}
              loading={loading}
              latestDataTimestamp={latestDataTimestamp}
              freshnessWarning={freshnessWarning}
            />
            <article className="card">
              <RecommendationSummary recommendation={recommendation} freshnessWarning={freshnessWarning} loading={loading} />
            </article>
          </section>

          <AppliancePlanner
            profiles={applianceProfiles}
            applianceId={applianceId}
            duration={duration}
            powerKw={powerKw}
            deadline={deadline}
            mode={mode}
            modes={modes}
            loading={loading}
            priceAvailable={priceAvailable}
            onApplianceChange={onApplianceChange}
            onDurationChange={setDuration}
            onPowerChange={setPowerKw}
            onDeadlineChange={setDeadline}
            onModeChange={setMode}
            onSubmit={onSubmit}
          />

          {recommendation?.appliance_impact ? <ApplianceImpactCard impact={recommendation.appliance_impact} /> : null}

          {signals ? <SignalCharts points={signals.points} /> : null}

          {recommendation ? (
            <CandidateWindows topWindows={recommendation.top_windows} avoidWindows={recommendation.avoid_windows ?? []} />
          ) : null}

          {signals ? <NerdTable points={signals.points} /> : null}

          <DataSources freshness={activeFreshness} />
        </>
      ) : null}
    </main>
  );
}
