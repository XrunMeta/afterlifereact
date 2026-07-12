

import { create } from 'zustand';

export interface TimingConfig {

  sttEndpointMs: number;

  echoGateMs: number;

  cloneResumeMs: number;

  cloneTailGraceMs: number;
}

export const TIMING_DEFAULTS: TimingConfig = {
  sttEndpointMs: 1500,
  echoGateMs: 3500,
  cloneResumeMs: 600,
  cloneTailGraceMs: 1000,
};

export const TIMING_BOUNDS: Record<keyof TimingConfig, { min: number; max: number; step: number }> = {
  sttEndpointMs: { min: 300, max: 4000, step: 100 },
  echoGateMs: { min: 0, max: 6000, step: 250 },
  cloneResumeMs: { min: 100, max: 3000, step: 100 },
  cloneTailGraceMs: { min: 200, max: 4000, step: 100 },
};

const clamp = (key: keyof TimingConfig, v: number): number => {
  if (!Number.isFinite(v)) return TIMING_DEFAULTS[key];
  const { min, max } = TIMING_BOUNDS[key];
  return Math.min(max, Math.max(min, v));
};

export const CONFIRM_GATE_DEFAULT = false;

interface TimingConfigState extends TimingConfig {
  confirmGateEnabled: boolean;
  setField: (key: keyof TimingConfig, value: number) => void;
  setConfirmGateEnabled: (v: boolean) => void;
  reset: () => void;
}

export const useTimingConfigStore = create<TimingConfigState>((set) => ({
  ...TIMING_DEFAULTS,
  confirmGateEnabled: CONFIRM_GATE_DEFAULT,
  setField: (key, value) => set({ [key]: clamp(key, value) } as Pick<TimingConfig, typeof key>),
  setConfirmGateEnabled: (v) => set({ confirmGateEnabled: v }),
  reset: () => set({ ...TIMING_DEFAULTS, confirmGateEnabled: CONFIRM_GATE_DEFAULT }),
}));
