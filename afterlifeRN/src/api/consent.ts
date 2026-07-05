

import { authFetch } from '../lib/authFetch';

export type CallLearningState = 'granted' | 'none';

export interface SaveCallLearningConsentOptions {
  termsVersion?: string;
  channel?: 'signup' | 'settings';
}

export async function saveCallLearningConsent(
  accessToken: string,
  state: 'granted' | 'revoked',
  opts?: SaveCallLearningConsentOptions,
): Promise<{ ok: boolean; state: string }> {
  const body: Record<string, unknown> = { state };
  if (opts?.termsVersion !== undefined) body.termsVersion = opts.termsVersion;
  if (opts?.channel !== undefined) body.channel = opts.channel;

  return authFetch<{ ok: boolean; state: string }>(
    '/oth-path',
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function getCallLearningConsent(
  accessToken: string,
): Promise<CallLearningState> {
  const result = await authFetch<{ call_learning: { state: CallLearningState; at?: number | null } }>(
    '/oth-path',
    accessToken,
    { method: 'GET' },
  );
  return result.call_learning.state;
}
