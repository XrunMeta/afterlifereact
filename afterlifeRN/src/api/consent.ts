

import { v_04b58a } from '../lib/authFetch';

export type CallLearningState = 'granted' | 'none';

export interface SaveCallLearningConsentOptions {
  termsVersion?: string;
  channel?: 'signup' | 'settings';
}

export async function v_7f847d(
  v_2ca7e0,
  v_b6e533,
  v_328259,
): Promise<{ ok: boolean; state: string }> {
  const v_4d33b2 = { state: v_b6e533 };
  if (v_328259?.termsVersion !== undefined) v_4d33b2.termsVersion = v_328259.termsVersion;
  if (v_328259?.channel !== undefined) v_4d33b2.channel = v_328259.channel;

  return v_04b58a<{ ok: boolean; state: string }>(
    '/oth-path',
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify(v_4d33b2) },
  );
}

export async function v_b14b3b(
  v_2ca7e0,
): Promise<CallLearningState> {
  const v_43c42e = await v_04b58a<{ call_learning: { state: CallLearningState; at?: number | null } }>(
    '/oth-path',
    v_2ca7e0,
    { method: 'GET' },
  );
  return v_43c42e.call_learning.state;
}
