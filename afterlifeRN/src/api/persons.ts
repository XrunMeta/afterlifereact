

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

export async function createPerson(
  accessToken: string,
  payload: CreatePersonPayload,
): Promise<CreatePersonResponse> {
  const body: Record<string, unknown> = { cloneId: payload.cloneId };
  if (payload.displayName !== undefined) body.displayName = payload.displayName;
  if (payload.enrolledVia !== undefined) body.enrolledVia = payload.enrolledVia;
  return authFetch<CreatePersonResponse>('/oth-path', accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
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
  cloneId?: number,
): Promise<{ items: Person[] }> {
  const path = cloneId !== undefined ? `/oth-path?cloneId=${cloneId}` : '/oth-path';
  const res = await authFetch<{ data?: Person[] }>(
    path,
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
  cloneId: number,
): Promise<MatchResult> {
  return authFetch<MatchResult>('/oth-path', accessToken, {
    method: 'POST',
    body: JSON.stringify({ vector, cloneId }),
  });
}

export async function enrollFaces(
  accessToken: string,
  personId: number,
  vectors: number[][],
  cloneId: number,
): Promise<{ enrolled: number }> {
  return authFetch<{ enrolled: number }>(`/oth-path${personId}/faces`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ vectors, cloneId }),
  });
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

export async function selfConfirm(
  accessToken: string,
  cloneId: number,
  vectors: number[][],
  displayName?: string,
): Promise<{ personId: number; selfPersonId: number }> {
  const body: Record<string, unknown> = { vectors };
  if (displayName !== undefined) body.displayName = displayName;
  return authFetch<{ personId: number; selfPersonId: number }>(
    `/oth-path${cloneId}/self-confirm`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function fetchFacePolicy(
  accessToken: string,
  cloneId: number,
): Promise<{ faceIdentifyEnabled: boolean }> {
  return authFetch<{ faceIdentifyEnabled: boolean }>(
    `/oth-path${cloneId}/face-policy`,
    accessToken,
    { method: 'GET' },
  );
}

export interface RememberingClone {
  cloneId: number;
  name: string;
  username: string;
  updatedAt: number;
}

export async function listRememberingClones(
  accessToken: string,
): Promise<{ clones: RememberingClone[] }> {
  return authFetch<{ clones: RememberingClone[] }>('/oth-path', accessToken, {
    method: 'GET',
  });
}

export async function deleteRememberingClone(
  accessToken: string,
  cloneId: number,
): Promise<{ deletedPersons: number; deletedVectors: number }> {
  return authFetch<{ deletedPersons: number; deletedVectors: number }>(
    `/oth-path${cloneId}`,
    accessToken,
    { method: 'DELETE' },
  );
}
