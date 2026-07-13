

import { authFetch } from '../lib/authFetch';

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
}

export interface CreatePersonPayload {
  cloneId?: number;

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

export async function createPerson(
  accessToken: string,
  payload?: CreatePersonPayload,
): Promise<CreatePersonResponse> {
  const body: Record<string, unknown> = {};
  if (payload?.cloneId !== undefined) {
    body.cloneId = payload.cloneId;
  }
  if (payload?.displayName !== undefined) {
    body.displayName = payload.displayName;
  }
  if (payload?.enrolledVia !== undefined) {
    body.enrolledVia = payload.enrolledVia;
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

export async function matchFace(
  accessToken: string,
  vector: number[],
): Promise<MatchResult> {
  return authFetch<MatchResult>(
    '/oth-path',
    accessToken,
    { method: 'POST', body: JSON.stringify({ vector }) },
  );
}

export async function enrollFaces(
  accessToken: string,
  personId: number,
  vectors: number[][],
): Promise<{ enrolled: number }> {
  return authFetch<{ enrolled: number }>(
    `/oth-path${personId}/faces`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ vectors }) },
  );
}

export async function deletePerson(
  accessToken: string,
  personId: number,
): Promise<{ deleted: boolean }> {
  return authFetch<{ deleted: boolean }>(
    `/oth-path${personId}`,
    accessToken,
    { method: 'DELETE' },
  );
}

export async function updatePersonName(
  accessToken: string,
  personId: number,
  displayName: string,
): Promise<{ id: number; displayName: string }> {
  return authFetch<{ id: number; displayName: string }>(
    `/oth-path${personId}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify({ displayName }) },
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
}

export async function calibrateFace(
  accessToken: string,
  vector: number[],
  groundTruthPersonId: number | null,
): Promise<{ id: number; matchedId: string | null; bestScore: number; threshold: number; scoreCount: number }> {
  return authFetch<{ id: number; matchedId: string | null; bestScore: number; threshold: number; scoreCount: number }>(
    '/oth-path',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        vector,
        groundTruthPersonId: groundTruthPersonId != null ? String(groundTruthPersonId) : null,
      }),
    },
  );
}

export async function getCalibrationSamples(
  accessToken: string,
  since = 0,
): Promise<{ samples: CalibrationSample[]; nextSince: number }> {
  return authFetch<{ samples: CalibrationSample[]; nextSince: number }>(
    `/oth-path?since=${since}`,
    accessToken,
    { method: 'GET' },
  );
}
