"use client";

import type { FormEvent } from "react";

import { deadlinePresets, modeLabel } from "../lib/format";
import type { ApplianceProfile } from "../lib/types";
import { ApplianceIcon } from "./ApplianceIcon";

type Props = {
  profiles: ApplianceProfile[];
  applianceId: string;
  duration: number;
  powerKw: string;
  deadline: string;
  mode: string;
  modes: string[];
  loading: boolean;
  priceAvailable: boolean;
  onApplianceChange: (applianceId: string) => void;
  onDurationChange: (duration: number) => void;
  onPowerChange: (powerKw: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onModeChange: (mode: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

// Guided, tactile planner: pick appliance, priority, deadline; fine-tune below.
export function PlannerCard(props: Props) {
  const selectedProfile = props.profiles.find((profile) => profile.id === props.applianceId) ?? null;
  const presets = deadlinePresets();

  return (
    <section className="card planner-card">
      <form onSubmit={props.onSubmit}>
        <div className="planner-step">
          <p className="step-label"><b>1</b> What do you want to run?</p>
          {props.profiles.length === 0 ? (
            <p className="hint">Loading appliance profiles...</p>
          ) : (
            <div className="appliance-tiles" role="radiogroup" aria-label="Appliance">
              {props.profiles.map((profile) => (
                <button
                  aria-checked={profile.id === props.applianceId}
                  className={`appliance-tile${profile.id === props.applianceId ? " selected" : ""}`}
                  key={profile.id}
                  onClick={() => props.onApplianceChange(profile.id)}
                  role="radio"
                  type="button"
                >
                  <ApplianceIcon applianceId={profile.id} />
                  <span className="tile-label">{profile.label}</span>
                  <span className="tile-meta">{formatTileMeta(profile)}</span>
                </button>
              ))}
            </div>
          )}
          {selectedProfile ? <p className="hint tile-description">{selectedProfile.short_description}</p> : null}
        </div>

        <div className="planner-step">
          <p className="step-label"><b>2</b> What matters most?</p>
          <div className="segmented" role="radiogroup" aria-label="Optimization priority">
            {props.modes.map((item) => (
              <button
                aria-checked={item === props.mode}
                className={item === props.mode ? "selected" : ""}
                key={item}
                onClick={() => props.onModeChange(item)}
                role="radio"
                type="button"
              >
                {modeLabel(item)}
              </button>
            ))}
          </div>
          {!props.priceAvailable ? (
            <p className="warning">Price data is unavailable right now; cheapest falls back to renewable and grid signals.</p>
          ) : null}
        </div>

        <div className="planner-step">
          <p className="step-label"><b>3</b> When must it be done?</p>
          <div className="deadline-row">
            <div className="preset-chips" role="group" aria-label="Deadline presets">
              {presets.map((preset) => (
                <button
                  className={`preset-chip${props.deadline === preset.value ? " selected" : ""}`}
                  key={preset.value}
                  onClick={() => props.onDeadlineChange(preset.value)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="deadline-custom">
              <span>or pick exact</span>
              <input
                onChange={(event) => props.onDeadlineChange(event.target.value)}
                type="datetime-local"
                value={props.deadline}
              />
            </label>
          </div>
        </div>

        <details className="fine-tune">
          <summary>Fine-tune duration &amp; power</summary>
          <div className="fine-tune-grid">
            <label>
              Duration (minutes)
              <input
                max={24 * 60}
                min={15}
                onChange={(event) => props.onDurationChange(Number(event.target.value))}
                step={15}
                type="number"
                value={props.duration}
              />
            </label>
            <label>
              Power (kW)
              {selectedProfile?.power_options_kw?.length ? (
                <select onChange={(event) => props.onPowerChange(event.target.value)} value={props.powerKw}>
                  {selectedProfile.power_options_kw.map((item) => (
                    <option key={item} value={String(item)}>{item} kW</option>
                  ))}
                </select>
              ) : (
                <input
                  max={22}
                  min={0.1}
                  onChange={(event) => props.onPowerChange(event.target.value)}
                  placeholder="optional"
                  step={0.1}
                  type="number"
                  value={props.powerKw}
                />
              )}
            </label>
          </div>
          <p className="hint">Power is informational for energy and peak context; it does not change the score.</p>
        </details>

        <button className="cta" disabled={props.loading || !props.deadline || props.duration < 15} type="submit">
          {props.loading ? "Finding your moment..." : "Find my moment"}
        </button>
        <p className="hint planner-footnote">Your choices are remembered on this device only.</p>
      </form>
    </section>
  );
}

function formatTileMeta(profile: ApplianceProfile) {
  const hours = profile.default_duration_minutes / 60;
  const duration = Number.isInteger(hours) ? `${hours} h` : `${profile.default_duration_minutes} min`;
  if (profile.power_options_kw?.length) return `${duration} \u00b7 ${profile.power_options_kw[0]}-${profile.power_options_kw[profile.power_options_kw.length - 1]} kW`;
  if (profile.default_power_kw !== null) return `${duration} \u00b7 ${profile.default_power_kw} kW`;
  return duration;
}
