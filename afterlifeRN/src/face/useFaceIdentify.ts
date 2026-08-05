

import { useCallback, useMemo, useRef } from "react";
import { l2normalize } from "./l2normalize";
import { EmbeddingBuffer } from "./embeddingBuffer";
import {
  speakerIdReducer,
  INITIAL_SPEAKER_STATE,
  type SpeakerIdState,
  type SpeakerEvent,
  type MatchCycle,
} from "./speakerIdReducer";
import { matchFace, calibrateFace, type MatchResult } from "../api/persons";
import { FACE_DIAG_ENABLED, type FaceDiag, type FaceVerdict } from "../config/faceDiag";

export const NETWORK_FAIL_BACKOFF_THRESHOLD = 3;

export const NETWORK_FAIL_BACKOFF_MS = 10_000;

export type MatchFaceFn = (accessToken: string, vector: number[], cloneId: number) => Promise<MatchResult>;

export type CalibrateFaceFn = (
  accessToken: string,
  vector: number[],
  groundTruthPersonId: number | null,
) => ReturnType<typeof calibrateFace>;

export interface IdentifyCycleDeps {
  matchFaceFn: MatchFaceFn;

  calibrateFn?: CalibrateFaceFn;
}

export function deriveVerdict(sp: {
  confirmed: number | "unknown" | "none";
  candidate: number | "unknown" | null;
  streak: number;
}): FaceVerdict {
  if (sp.confirmed === "unknown") return "unknown"; 
  if (sp.confirmed !== "none") return "confirmed"; 
  if (sp.candidate != null && sp.streak > 0) return "candidate";
  return "none";
}

export interface IdentifyCycleState {
  speaker: SpeakerIdState;
  consecutiveFailures: number;

  backoffUntilMs: number;
}

export const INITIAL_IDENTIFY_CYCLE_STATE: IdentifyCycleState = {
  speaker: INITIAL_SPEAKER_STATE,
  consecutiveFailures: 0,
  backoffUntilMs: 0,
};

export async function runIdentifyCycle(
  state: IdentifyCycleState,
  vector: number[],
  accessToken: string,
  cloneId: number,
  nowMs: number,
  deps: IdentifyCycleDeps,
): Promise<{
  state: IdentifyCycleState;
  event: SpeakerEvent;

  cycle: MatchCycle | null;

  threshold: number | null;
}> {
  if (nowMs < state.backoffUntilMs) {
    return { state, event: null, cycle: null, threshold: null };
  }

  let result: MatchResult;
  try {
    result = await deps.matchFaceFn(accessToken, vector, cloneId);
  } catch {
    const consecutiveFailures = state.consecutiveFailures + 1;
    const backoffUntilMs =
      consecutiveFailures >= NETWORK_FAIL_BACKOFF_THRESHOLD
        ? nowMs + NETWORK_FAIL_BACKOFF_MS
        : state.backoffUntilMs;
    return { state: { ...state, consecutiveFailures, backoffUntilMs }, event: null, cycle: null, threshold: null };
  }

  const cycle: MatchCycle = {
    personId: result.best?.personId ?? null,
    displayName: result.best?.displayName ?? null,
    score: result.best?.score ?? 0,
  };
  const { state: speaker, event } = speakerIdReducer(state.speaker, cycle);
  return {
    state: { speaker, consecutiveFailures: 0, backoffUntilMs: 0 },
    event,
    cycle,
    threshold: result.threshold,
  };
}

export interface UseFaceIdentifyOptions {

  enabled: boolean;
  accessToken: string;

  cloneId: number;
  onEvent: (evt: SpeakerEvent) => void;

  onDiag?: (d: FaceDiag) => void;

  calibrate?: { accessToken: string; groundTruthPersonId: number | null } | null;

  deps?: IdentifyCycleDeps;

  now?: () => number;
}

export interface UseFaceIdentifyResult {

  onEmbedding: (raw: number[]) => void;

  getBuffer: () => EmbeddingBuffer;

  resetRecognition: () => void;
}

export function useFaceIdentify(opts: UseFaceIdentifyOptions): UseFaceIdentifyResult {
  const { enabled, accessToken, cloneId, onEvent, onDiag, calibrate } = opts;
  const deps = useMemo<IdentifyCycleDeps>(() => opts.deps ?? { matchFaceFn: matchFace }, [opts.deps]);
  const nowFn = opts.now ?? Date.now;

  const stateRef = useRef<IdentifyCycleState>(INITIAL_IDENTIFY_CYCLE_STATE);
  const bufferRef = useRef<EmbeddingBuffer>(new EmbeddingBuffer());
  const inFlightRef = useRef(false);

  const resetRecognition = useCallback(() => {
    const { state: speaker } = speakerIdReducer(stateRef.current.speaker, { type: "RESET_RECOGNITION" });
    stateRef.current = { ...stateRef.current, speaker };
  }, []);

  const onEmbedding = useCallback(
    (raw: number[]) => {
      if (!enabled || !accessToken) return;
      if (inFlightRef.current) return; 
      const vec = l2normalize(Float32Array.from(raw));
      bufferRef.current.push(vec);
      inFlightRef.current = true;
      void runIdentifyCycle(stateRef.current, vec, accessToken, cloneId, nowFn(), deps)
        .then(({ state, event, cycle, threshold }) => {
          stateRef.current = state;
          if (event) onEvent(event);

          if (FACE_DIAG_ENABLED && cycle && threshold != null) {
            const diag: FaceDiag = {
              score: cycle.score,
              personId: cycle.personId,
              displayName: cycle.displayName,
              streak: state.speaker.streak,
              verdict: deriveVerdict(state.speaker),
              threshold,
            };
            onDiag?.(diag);

            console.log(
              `[FACEDIAG] ${JSON.stringify({
                ts: nowFn(),
                score: diag.score,
                personId: diag.personId,
                streak: diag.streak,
                verdict: diag.verdict,
                threshold: diag.threshold,
              })}`,
            );
            if (calibrate) {
              (deps.calibrateFn ?? calibrateFace)(calibrate.accessToken, vec, calibrate.groundTruthPersonId).catch(
                () => {}, 
              );
            }
          }
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    },
    [enabled, accessToken, cloneId, onEvent, onDiag, calibrate, deps, nowFn],
  );

  return { onEmbedding, getBuffer: () => bufferRef.current, resetRecognition };
}
