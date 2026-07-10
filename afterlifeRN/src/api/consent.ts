

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

export type FaceBiometricState = 'granted' | 'none';

export interface FaceBiometricConsent {
  state: FaceBiometricState;
  version: string | null;
  at: number | null;
}

export interface SaveFaceBiometricConsentOptions {
  termsVersion?: string;
  channel?: 'signup' | 'settings' | 'retro_prompt';
}

export async function saveFaceBiometricConsent(
  accessToken: string,
  state: 'granted' | 'revoked',
  opts?: SaveFaceBiometricConsentOptions,
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

export async function getFaceBiometricConsent(
  accessToken: string,
): Promise<FaceBiometricConsent> {
  const result = await authFetch<{ face_biometric: FaceBiometricConsent }>(
    '/oth-path',
    accessToken,
    { method: 'GET' },
  );
  return result.face_biometric;
}
