

import { v_04b58a } from '../lib/authFetch';

export type ConsentState = 'none' | 'granted' | 'revoked';

export interface Person {
  id: number;
  consentState: ConsentState;

  displayName?: string | null;

  enrolledVia?: 'card' | 'auto_biometric';
  cloneId?: number | null;
  termsVersion?: string | null;
  channel?: string | null;
  createdAt?: string;
  updatedAt?: string;

  faceCount?: number;

  isSelf?: boolean;
}

export interface CreatePersonPayload {

  cloneId: number;

  displayName?: string;

  enrolledVia?: 'card' | 'auto_biometric';
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
  const v_4d33b2 = { cloneId: v_931bf0.cloneId };
  if (v_931bf0.displayName !== undefined) v_4d33b2.displayName = v_931bf0.displayName;
  if (v_931bf0.enrolledVia !== undefined) v_4d33b2.enrolledVia = v_931bf0.enrolledVia;
  return v_04b58a<CreatePersonResponse>('/oth-path', v_2ca7e0, {
    method: 'POST',
    body: JSON.stringify(v_4d33b2),
  });
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
  v_6e0fd3,
): Promise<{ items: Person[] }> {
  const v_9fe22d = v_6e0fd3 !== undefined ? `/oth-path?cloneId=${v_6e0fd3}` : '/oth-path';
  const v_8f00b9 = await v_04b58a<{ data?: Person[] }>(
    v_9fe22d,
    v_2ca7e0,
    { method: 'GET' },
  );
  return { items: v_8f00b9?.data ?? [] };
}

export interface MatchCandidate {
  personId: number;
  displayName: string | null;
  score: number;
}

export interface MatchResult {
  matches: MatchCandidate[];
  best: MatchCandidate | null;
  threshold: number;
}

export async function v_afc2e6(
  v_2ca7e0,
  v_f9a45c,
  v_6e0fd3,
): Promise<MatchResult> {
  return v_04b58a<MatchResult>('/oth-path', v_2ca7e0, {
    method: 'POST',
    body: JSON.stringify({ vector: v_f9a45c, cloneId: v_6e0fd3 }),
  });
}

export async function v_4585d1(
  v_2ca7e0,
  v_ca1ec5,
  v_f94e64,
  v_6e0fd3,
): Promise<{ enrolled: number }> {
  return v_04b58a<{ enrolled: number }>(`/oth-path${v_ca1ec5}/faces`, v_2ca7e0, {
    method: 'POST',
    body: JSON.stringify({ vectors: v_f94e64, cloneId: v_6e0fd3 }),
  });
}

export async function v_a94a1b(
  v_2ca7e0,
  v_ca1ec5,
): Promise<{ deleted: boolean }> {
  return v_04b58a<{ deleted: boolean }>(
    `/oth-path${v_ca1ec5}`,
    v_2ca7e0,
    { method: 'DELETE' },
  );
}

export async function v_137542(
  v_2ca7e0,
  v_ca1ec5,
  v_8a1355,
): Promise<{ id: number; displayName: string }> {
  return v_04b58a<{ id: number; displayName: string }>(
    `/oth-path${v_ca1ec5}`,
    v_2ca7e0,
    { method: 'PATCH', body: JSON.stringify({ displayName: v_8a1355 }) },
  );
}

export interface CalibrationSample {
  id: number;
  ts: number;
  groundTruthPersonId: string | null;
  matchedId: string | null;
  bestScore: number;
  scores: { personId: string; score: number }[];
  threshold: number;

  matchedHasL2p: boolean | null;
}

export type CalibrateFaceResponse = {
  id: number;
  matchedId: string | null;
  bestScore: number;
  threshold: number;
  scoreCount: number;

  matchedHasL2p: boolean | null;
};

export async function v_383262(
  v_2ca7e0,
  v_f9a45c,
  v_b0015d,
  v_6e0fd3,
): Promise<CalibrateFaceResponse> {
  return v_04b58a<CalibrateFaceResponse>(
    '/oth-path',
    v_2ca7e0,
    {
      method: 'POST',
      body: JSON.stringify({
        vector: v_f9a45c,
        groundTruthPersonId: v_b0015d != null ? String(v_b0015d) : null,
        cloneId: v_6e0fd3,
      }),
    },
  );
}

export async function v_05f7f4(
  v_2ca7e0,
  v_8738be = 0,
): Promise<{ samples: CalibrationSample[]; nextSince: number }> {
  return v_04b58a<{ samples: CalibrationSample[]; nextSince: number }>(
    `/oth-path?since=${v_8738be}`,
    v_2ca7e0,
    { method: 'GET' },
  );
}

export async function v_238ce0(
  v_2ca7e0,
  v_6e0fd3,
  v_f94e64,
  v_8a1355,
): Promise<{ personId: number; selfPersonId: number }> {
  const v_4d33b2 = { vectors: v_f94e64 };
  if (v_8a1355 !== undefined) v_4d33b2.displayName = v_8a1355;
  return v_04b58a<{ personId: number; selfPersonId: number }>(
    `/oth-path${v_6e0fd3}/self-confirm`,
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify(v_4d33b2) },
  );
}

export async function v_20bacb(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ faceIdentifyEnabled: boolean }> {
  return v_04b58a<{ faceIdentifyEnabled: boolean }>(
    `/oth-path${v_6e0fd3}/face-policy`,
    v_2ca7e0,
    { method: 'GET' },
  );
}

export interface RememberingClone {
  cloneId: number;
  name: string;
  username: string;
  updatedAt: number;
}

export async function v_a1ba62(
  v_2ca7e0,
): Promise<{ clones: RememberingClone[] }> {
  return v_04b58a<{ clones: RememberingClone[] }>('/oth-path', v_2ca7e0, {
    method: 'GET',
  });
}

export async function v_c63c1d(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ deletedPersons: number; deletedVectors: number }> {
  return v_04b58a<{ deletedPersons: number; deletedVectors: number }>(
    `/oth-path${v_6e0fd3}`,
    v_2ca7e0,
    { method: 'DELETE' },
  );
}

export async function v_6ffcc5(
  v_2ca7e0,
  v_ca1ec5,
  v_dd8af0,
): Promise<{ id: number; relation: string }> {
  return v_04b58a<{ id: number; relation: string }>(
    `/oth-path${v_ca1ec5}/relation`,
    v_2ca7e0,
    { method: 'PATCH', body: JSON.stringify({ relation: v_dd8af0 }) },
  );
}
