"use client";

import type { FormEvent } from "react";
import type { ApplianceProfile } from "../lib/types";

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

export function AppliancePlanner(props: Props) {
  const selectedProfile = props.profiles.find((profile) => profile.id === props.applianceId) ?? null;

  return (
    <section className="card">
      <h2>Appliance Planner</h2>
      <form className="planner" onSubmit={props.onSubmit}>
        <label>
          Appliance
          <select value={props.applianceId} onChange={(event) => props.onApplianceChange(event.target.value)}>
            {props.profiles.length === 0 ? <option value={props.applianceId}>Loading profiles...</option> : null}
            {props.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.label}</option>
            ))}
          </select>
        </label>
        <label>
          Duration (min)
          <input
            type="number"
            min={15}
            max={24 * 60}
            step={15}
            value={props.duration}
            onChange={(event) => props.onDurationChange(Number(event.target.value))}
          />
        </label>
        <label>
          Power (kW)
          {selectedProfile?.power_options_kw?.length ? (
            <select value={props.powerKw} onChange={(event) => props.onPowerChange(event.target.value)}>
              {selectedProfile.power_options_kw.map((item) => (
                <option key={item} value={String(item)}>{item} kW</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={0.1}
              max={22}
              step={0.1}
              value={props.powerKw}
              onChange={(event) => props.onPowerChange(event.target.value)}
              placeholder="optional"
            />
          )}
        </label>
        <label>
          Deadline
          <input type="datetime-local" value={props.deadline} onChange={(event) => props.onDeadlineChange(event.target.value)} />
        </label>
        <label>
          Optimization
          <select value={props.mode} onChange={(event) => props.onModeChange(event.target.value)}>
            {props.modes.map((item) => (
              <option key={item} value={item}>{item.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={props.loading || !props.deadline || props.duration < 15}>
          {props.loading ? "Calculating..." : "Find best window"}
        </button>
      </form>
      {selectedProfile ? <p className="hint">{selectedProfile.short_description}</p> : null}
      <p className="hint">Appliance power is informational for energy/peak context; it does not change the score. Your planner choices are remembered on this device only.</p>
      <p className={props.priceAvailable ? "hint" : "warning"}>
        {props.priceAvailable
          ? "Price data is available for at least part of the planning horizon."
          : "Price data unavailable; recommendations fall back to renewable/load/convenience scoring."}
      </p>
    </section>
  );
}
