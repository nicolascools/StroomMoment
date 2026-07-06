"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { AlternativeWindows } from "./components/AlternativeWindows";
import { ApplianceImpactCard } from "./components/ApplianceImpactCard";
import { DataSources } from "./components/DataSources";
import { DayTimeline } from "./components/DayTimeline";
import { DecisionHero } from "./components/DecisionHero";
import { Disclosure } from "./components/Disclosure";
import { NerdTable } from "./components/NerdTable";
import { PlannerCard } from "./components/PlannerCard";
import { SignalCharts } from "./components/SignalCharts";
import { HeroSkeleton, SkeletonCard } from "./components/Skeletons";
import { TopBar } from "./components/TopBar";
import { FEEDBACK_URL, fetchAppliances, fetchRecommendation, fetchSignals } from "./lib/api";
import { defaultDeadlineBrussels, defaultPowerValue, hasFreshnessWarning } from "./lib/format";
import { loadPlannerPrefs, savePlannerPrefs } from "./lib/prefs";
import type { ApplianceProfile, Recommendation, SignalSnapshot } from "./lib/types";

const defaultApplianceId = "dishwasher";
const modes = ["balanced", "cheapest", "renewable", "low_load"];

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
  const heroRef = useRef<HTMLDivElement | null>(null);

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
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const currentPoint = signals?.points[0];
  const priceAvailable = signals?.points.some((point) => point.price_eur_mwh !== null) ?? false;
  const activeFreshness = recommendation?.freshness.length ? recommendation.freshness : signals?.freshness ?? [];
  const freshnessWarning = hasFreshnessWarning(activeFreshness);
  const dataStatus = !mounted || (!signals && !recommendation) ? null : freshnessWarning ? "warn" : "ok";
  const initialLoading = loading && !signals && !recommendation;

  return (
    <div className="app-shell">
      <TopBar dataStatus={dataStatus} />
      <main>
        {!mounted ? (
          <section className="hero-card hero-empty stable-shell">
            <p className="hero-eyebrow">StroomMoment</p>
            <h1 className="hero-question">When should I use electricity?</h1>
            <p className="hero-sub">Finding the best time to run your appliances in Belgium.</p>
          </section>
        ) : null}

        {mounted && error ? (
          <section className="error-banner">
            <div>
              <strong>We hit a snag</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => window.location.reload()} type="button">Try again</button>
          </section>
        ) : null}

        {mounted && initialLoading ? (
          <>
            <HeroSkeleton />
            <SkeletonCard lines={6} />
          </>
        ) : null}

        {mounted && !initialLoading ? (
          <>
            <div ref={heroRef}>
              <DecisionHero
                currentPoint={currentPoint}
                freshnessWarning={freshnessWarning}
                loading={loading}
                recommendation={recommendation}
              />
            </div>

            {recommendation ? <DayTimeline recommendation={recommendation} /> : null}

            <PlannerCard
              applianceId={applianceId}
              deadline={deadline}
              duration={duration}
              loading={loading}
              mode={mode}
              modes={modes}
              onApplianceChange={onApplianceChange}
              onDeadlineChange={setDeadline}
              onDurationChange={setDuration}
              onModeChange={setMode}
              onPowerChange={setPowerKw}
              onSubmit={onSubmit}
              powerKw={powerKw}
              priceAvailable={priceAvailable}
              profiles={applianceProfiles}
            />

            {recommendation ? <AlternativeWindows recommendation={recommendation} /> : null}

            {recommendation?.appliance_impact ? <ApplianceImpactCard impact={recommendation.appliance_impact} /> : null}

            {signals ? (
              <Disclosure subtitle="Price, PV/wind, and load forecasts behind the advice" title="The signals behind this advice">
                <SignalCharts points={signals.points} />
              </Disclosure>
            ) : null}

            {signals ? (
              <Disclosure subtitle="Normalized 15-minute points, Europe/Brussels" title="Nerd data view">
                <NerdTable points={signals.points} />
              </Disclosure>
            ) : null}

            <Disclosure subtitle="Where the data comes from and how fresh it is" title="Data sources & disclaimers">
              <DataSources freshness={activeFreshness} />
            </Disclosure>
          </>
        ) : null}
      </main>
      <footer className="site-footer">
        <p>
          Public proof of concept. Data: Elia Open Data and Energy-Charts (CC BY 4.0). Prices are wholesale day-ahead signals for the Belgian bidding zone, not your supplier tariff.
        </p>
        {FEEDBACK_URL ? (
          <a href={FEEDBACK_URL} rel="noreferrer" target="_blank">Send feedback</a>
        ) : null}
      </footer>
    </div>
  );
}
