

import type { FaceDiag } from "../config/faceDiag";
import {
  attachDiag,
  initFaceRoster,
  observeFaceTracks,
  type FaceRosterState,
} from "./faceTrackRoster";

let state: FaceRosterState = initFaceRoster();
let subs: Array<(s: FaceRosterState) => void> = [];

function notify(): void {
  const snapshot = state;

  for (const cb of subs.slice()) {
    try {
      cb(snapshot);
    } catch (e) {
      if (!__DEV__) return;

      console.log("[Call][faceTrack][subscriber-error]", String(e));
    }
  }
}

export function publishFaceTracks(trackingIds: number[], nowMs: number): void {
  if (!__DEV__) return;
  const next = observeFaceTracks(state, trackingIds, nowMs);
  if (next === state) return; 
  state = next;
  notify();
}

export function publishFaceDiag(diag: FaceDiag | null, nowMs: number): void {
  if (!__DEV__) return;
  const next = attachDiag(state, diag, nowMs);
  if (next === state) return;
  state = next;
  notify();
}

export function resetFaceRoster(): void {
  state = initFaceRoster();
  notify();
}

export function getFaceRoster(): FaceRosterState {
  return state;
}

export function subscribeFaceRoster(cb: (s: FaceRosterState) => void): () => void {
  subs.push(cb);
  cb(state); 
  return () => {
    subs = subs.filter((f) => f !== cb);
  };
}
