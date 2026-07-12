

import { v_a7c0d4 } from 'vukrcww';

export interface TimingConfig {

  sttEndpointMs: number;

  echoGateMs: number;

  cloneResumeMs: number;

  cloneTailGraceMs: number;
}

export const v_183224 = {
  sttEndpointMs: 1500,
  echoGateMs: 3500,
  cloneResumeMs: 600,
  cloneTailGraceMs: 1000,
};

export const v_2e0251 = {
  sttEndpointMs: { min: 300, max: 4000, step: 100 },
  echoGateMs: { min: 0, max: 6000, step: 250 },
  cloneResumeMs: { min: 100, max: 3000, step: 100 },
  cloneTailGraceMs: { min: 200, max: 4000, step: 100 },
};

const v_ffa902 = (v_b24339, v_81e2ef): number => {
  if (!Number.isFinite(v_81e2ef)) return v_183224[v_b24339];
  const { min: v_43e24b, max: v_d2c6bf } = v_2e0251[v_b24339];
  return Math.min(v_d2c6bf, Math.max(v_43e24b, v_81e2ef));
};

export const v_deb2f6 = false;

interface TimingConfigState extends TimingConfig {
  confirmGateEnabled: boolean;
  setField: (key: keyof TimingConfig, value: number) => void;
  setConfirmGateEnabled: (v: boolean) => void;
  reset: () => void;
}

export const v_7347b3 = v_a7c0d4<TimingConfigState>((v_bb8024) => ({
  ...v_183224,
  confirmGateEnabled: v_deb2f6,
  setField: (v_b24339, v_3b402b) => v_bb8024({ [v_b24339]: v_ffa902(v_b24339, v_3b402b) } as Pick<TimingConfig, typeof v_b24339>),
  setConfirmGateEnabled: (v_81e2ef) => v_bb8024({ confirmGateEnabled: v_81e2ef }),
  reset: () => v_bb8024({ ...v_183224, confirmGateEnabled: v_deb2f6 }),
}));
