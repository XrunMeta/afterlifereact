

import type { FaceDiag, FaceVerdict } from "../config/faceDiag";

export const MAX_TRACK_ENTRIES = 6;

export const ACTIVE_TTL_MS = 2500;

export interface FaceTrackMatch {
  personId: number | null;
  displayName: string | null;
  score: number;
  verdict: FaceVerdict;
  streak: number;
}

export interface FaceTrackEntry {

  trackingId: number;

  label: number;
  firstSeenMs: number;
  lastSeenMs: number;

  seenCount: number;

  match: FaceTrackMatch | null;
}

export interface FaceRosterState {

  entries: FaceTrackEntry[];

  nextLabel: number;

  lastDiag: FaceDiag | null;
  lastDiagAtMs: number;
}

export function initFaceRoster(): FaceRosterState {
  return { entries: [], nextLabel: 1, lastDiag: null, lastDiagAtMs: 0 };
}

export function observeFaceTracks(
  state: FaceRosterState,
  trackingIds: number[],
  nowMs: number,
): FaceRosterState {
  const ids: number[] = [];
  for (const id of trackingIds) {
    if (typeof id !== "number" || !Number.isFinite(id)) continue;
    if (!ids.includes(id)) ids.push(id); 
  }
  if (ids.length === 0) return state;

  let entries = state.entries;
  let nextLabel = state.nextLabel;
  let changed = false;

  for (const id of ids) {
    const idx = entries.findIndex((e) => e.trackingId === id);
    if (idx >= 0) {
      const prev = entries[idx];
      const next: FaceTrackEntry = {
        ...prev,
        lastSeenMs: nowMs,
        seenCount: prev.seenCount + 1,
      };
      entries = changed ? entries : entries.slice();
      entries[idx] = next;
      changed = true;
    } else {
      entries = changed ? entries : entries.slice();
      entries.push({
        trackingId: id,
        label: nextLabel,
        firstSeenMs: nowMs,
        lastSeenMs: nowMs,
        seenCount: 1,
        match: null,
      });
      nextLabel += 1;
      changed = true;
    }
  }

  if (entries.length > MAX_TRACK_ENTRIES) {

    const doomed = entries
      .slice()
      .sort((a, b) => a.lastSeenMs - b.lastSeenMs)
      .slice(0, entries.length - MAX_TRACK_ENTRIES)
      .map((e) => e.trackingId);
    entries = entries.filter((e) => !doomed.includes(e.trackingId));
  }

  return { ...state, entries, nextLabel };
}

export function isTrackActive(entry: FaceTrackEntry, nowMs: number): boolean {
  return nowMs - entry.lastSeenMs <= ACTIVE_TTL_MS;
}

export function attachDiag(
  state: FaceRosterState,
  diag: FaceDiag | null,
  nowMs: number,
): FaceRosterState {
  if (diag == null) {
    if (state.lastDiag == null) return state;
    return { ...state, lastDiag: null };
  }
  const activeIdx = state.entries
    .map((e, i) => (isTrackActive(e, nowMs) ? i : -1))
    .filter((i) => i >= 0);

  let entries = state.entries;
  if (activeIdx.length === 1) {
    const i = activeIdx[0];
    entries = entries.slice();
    entries[i] = {
      ...entries[i],
      match: {
        personId: diag.personId,
        displayName: diag.displayName,
        score: diag.score,
        verdict: diag.verdict,
        streak: diag.streak,
      },
    };
  }
  return { ...state, entries, lastDiag: diag, lastDiagAtMs: nowMs };
}

export function formatTrackLine(entry: FaceTrackEntry, active: boolean): string {
  const head = `${active ? "*" : " "} 얼굴${entry.label} id:${entry.trackingId}`;
  if (entry.match == null) return `${head} -`;
  const m = entry.match;
  const who = m.displayName ?? (m.personId != null ? `#${m.personId}` : "?");
  const verdict = m.verdict.slice(0, 4); 
  return `${head} ${who} ${m.score.toFixed(2)} ${verdict} ${m.streak}/3`;
}
