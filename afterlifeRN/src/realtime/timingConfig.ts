

import { v_a7c0d4 } from 'vukrcww';

export interface TimingConfig {

  sttEndpointMs: number;

  echoGateMs: number;

  cloneResumeMs: number;

  cloneTailGraceMs: number;
}

export const v_5c20ea = {
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
  if (!Number.isFinite(v_81e2ef)) return v_5c20ea[v_b24339];
  const { min: v_43e24b, max: v_d2c6bf } = v_2e0251[v_b24339];
  return Math.min(v_d2c6bf, Math.max(v_43e24b, v_81e2ef));
};

const v_c38a4b = {
  sttEndpointMs: 'EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS',
  echoGateMs: 'EXPO_PUBLIC_TIMING_ECHO_GATE_MS',
  cloneResumeMs: 'EXPO_PUBLIC_TIMING_CLONE_RESUME_MS',
  cloneTailGraceMs: 'EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS',
};

const v_1a3a5b = /^\d+$/;

export function v_1dd45a(v_c9c489): TimingConfig {
  const v_43c42e = {} as TimingConfig;
  (Object.keys(v_c38a4b) as Array<keyof TimingConfig>).forEach((v_b24339) => {
    const v_479f05 = v_c9c489[v_c38a4b[v_b24339]];
    const v_2f361a = v_479f05?.trim();
    v_43c42e[v_b24339] =
      v_2f361a && v_1a3a5b.test(v_2f361a) ? v_ffa902(v_b24339, parseInt(v_2f361a, 10)) : v_5c20ea[v_b24339];
  });
  if (v_43c42e.cloneResumeMs >= v_43c42e.cloneTailGraceMs) {

    console.warn('[timingConfig] cloneResumeMs >= cloneTailGraceMs after ENV resolve (loop risk)', v_43c42e);
  }
  return v_43c42e;
}

export function v_d14be3(v_01dcf5): string {
  return (Object.keys(v_c38a4b) as Array<keyof TimingConfig>)
    .map((v_b24339) => `${v_c38a4b[v_b24339]}=${v_01dcf5[v_b24339]}`)
    .join('\n');
}

export const v_183224 = v_1dd45a(
  process.env as unknown as Record<string, string | undefined>,
);

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
