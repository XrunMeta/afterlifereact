

import { create } from 'zustand';

export interface TimingConfig {

  sttEndpointMs: number;

  echoGateMs: number;

  cloneResumeMs: number;

  cloneTailGraceMs: number;
}

export const FALLBACK_TIMING_DEFAULTS: TimingConfig = {
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
  if (!Number.isFinite(v)) return FALLBACK_TIMING_DEFAULTS[key];
  const { min, max } = TIMING_BOUNDS[key];
  return Math.min(max, Math.max(min, v));
};

const ENV_KEYS: Record<keyof TimingConfig, string> = {
  sttEndpointMs: 'EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS',
  echoGateMs: 'EXPO_PUBLIC_TIMING_ECHO_GATE_MS',
  cloneResumeMs: 'EXPO_PUBLIC_TIMING_CLONE_RESUME_MS',
  cloneTailGraceMs: 'EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS',
};

export function resolveTimingDefaults(env: Record<string, string | undefined>): TimingConfig {
  const result = {} as TimingConfig;
  (Object.keys(ENV_KEYS) as Array<keyof TimingConfig>).forEach((key) => {
    const raw = env[ENV_KEYS[key]];
    const parsed = parseInt(raw as string, 10);
    result[key] = Number.isFinite(parsed) ? clamp(key, parsed) : FALLBACK_TIMING_DEFAULTS[key];
  });
  if (result.cloneResumeMs >= result.cloneTailGraceMs) {

    console.warn('[timingConfig] cloneResumeMs >= cloneTailGraceMs after ENV resolve (loop risk)', result);
  }
  return result;
}

export function formatTimingEnv(cfg: TimingConfig): string {
  return (Object.keys(ENV_KEYS) as Array<keyof TimingConfig>)
    .map((key) => `${ENV_KEYS[key]}=${cfg[key]}`)
    .join('\n');
}

export const TIMING_DEFAULTS: TimingConfig = resolveTimingDefaults(
  process.env as unknown as Record<string, string | undefined>,
);

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
