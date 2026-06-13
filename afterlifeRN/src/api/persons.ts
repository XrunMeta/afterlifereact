

import { authFetch } from '../lib/authFetch';

export type ConsentState = 'none' | 'granted' | 'revoked';

export interface Person {
  id: number;
  consentState: ConsentState;
  cloneId?: number | null;
  termsVersion?: string | null;
  channel?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePersonPayload {
  cloneId?: number;
}

export interface CreatePersonResponse {
  id: number;
  consentState: ConsentState;
}

export interface SaveFaceConsentOptions {
  termsVersion?: string;
  channel?: string;
}

export async function createPerson(
  accessToken: string,
  payload?: CreatePersonPayload,
): Promise<CreatePersonResponse> {
  const body: Record<string, unknown> = {};
  if (payload?.cloneId !== undefined) {
    body.cloneId = payload.cloneId;
  }
  return authFetch<CreatePersonResponse>(
    '/oth-path',
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function saveFaceConsent(
  accessToken: string,
  personId: number,
  state: 'granted' | 'revoked',
  opts?: SaveFaceConsentOptions,
): Promise<ConsentState> {
  const body: Record<string, unknown> = { state };
  if (opts?.termsVersion !== undefined) body.termsVersion = opts.termsVersion;
  if (opts?.channel !== undefined) body.channel = opts.channel;

  const result = await authFetch<{ consentState: ConsentState }>(
    `/oth-path${personId}/consent`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return result.consentState;
}

export async function listPersons(
  accessToken: string,
): Promise<{ items: Person[] }> {
  const res = await authFetch<{ data?: Person[] }>(
    '/oth-path',
    accessToken,
    { method: 'GET' },
  );
  return { items: res?.data ?? [] };
}
