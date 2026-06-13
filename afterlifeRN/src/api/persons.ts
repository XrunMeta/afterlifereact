

import { v_04b58a } from '../lib/authFetch';

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

export async function v_4e7b87(
  v_2ca7e0,
  v_931bf0,
): Promise<CreatePersonResponse> {
  const v_4d33b2 = {};
  if (v_931bf0?.cloneId !== undefined) {
    v_4d33b2.cloneId = v_931bf0.cloneId;
  }
  return v_04b58a<CreatePersonResponse>(
    '/oth-path',
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify(v_4d33b2) },
  );
}

export async function v_31967f(
  v_2ca7e0,
  v_ca1ec5,
  v_b6e533,
  v_328259,
): Promise<ConsentState> {
  const v_4d33b2 = { state: v_b6e533 };
  if (v_328259?.termsVersion !== undefined) v_4d33b2.termsVersion = v_328259.termsVersion;
  if (v_328259?.channel !== undefined) v_4d33b2.channel = v_328259.channel;

  const v_43c42e = await v_04b58a<{ consentState: ConsentState }>(
    `/oth-path${v_ca1ec5}/consent`,
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify(v_4d33b2) },
  );
  return v_43c42e.consentState;
}

export async function v_865d38(
  v_2ca7e0,
): Promise<{ items: Person[] }> {
  const v_8f00b9 = await v_04b58a<{ data?: Person[] }>(
    '/oth-path',
    v_2ca7e0,
    { method: 'GET' },
  );
  return { items: v_8f00b9?.data ?? [] };
}
