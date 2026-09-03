

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
import { compareLandmarkRatios, type LandmarkRatios } from "./faceLandmarkRatios";
import { FACE_DIAG_ENABLED, type FaceDiag, type FaceVerdict } from "../config/faceDiag";

export const NETWORK_FAIL_BACKOFF_THRESHOLD = 3;

export const NETWORK_FAIL_BACKOFF_MS = 10_000;

export type MatchFaceFn = (accessToken: string, vector: number[], cloneId: number) => Promise<MatchResult>;

export type CalibrateFaceFn = (
  accessToken: string,
  vector: number[],
  groundTruthPersonId: number | null,
  cloneId: number,
) => ReturnType<typeof calibrateFace>;

export interface IdentifyCycleDeps {
  matchFaceFn: MatchFaceFn;

  calibrateFn?: CalibrateFaceFn;

  getCurrentLandmark?: () => LandmarkRatios | null;
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

  let bestPersonId = result.best?.personId ?? null;
  let bestDisplayName = result.best?.displayName ?? null;
  let rawEmbeddingScore = result.best?.score ?? result.matches[0]?.score ?? 0;

  const CLIENT_CONFIRM_MIN = 0.5;
  if (bestPersonId == null && result.matches[0]?.personId != null && result.matches[0].score >= CLIENT_CONFIRM_MIN) {
    bestPersonId = result.matches[0].personId;
    bestDisplayName = result.matches[0].displayName;
    rawEmbeddingScore = result.matches[0].score;
  }
  let effectiveScore = rawEmbeddingScore;

  const rtLandmark = deps.getCurrentLandmark?.();
  const savedLandmarks = result.best?.landmarkRatiosList;
  const prevConfirmedNum = typeof state.speaker.confirmed === "number" ? state.speaker.confirmed : null;

  const shouldApplyLandmarkGate =
    prevConfirmedNum != null && bestPersonId != null && bestPersonId !== prevConfirmedNum;
  if (
    shouldApplyLandmarkGate &&
    rtLandmark &&
    savedLandmarks &&
    savedLandmarks.length > 0
  ) {

    const nonNullSaved = savedLandmarks.filter((l): l is Record<string, number> => l != null);
    if (nonNullSaved.length > 0) {
      const sims = nonNullSaved.map((saved) =>
        compareLandmarkRatios(rtLandmark, saved as unknown as LandmarkRatios),
      );
      const meanSim = sims.reduce((a, b) => a + b, 0) / sims.length;

      const combined = rawEmbeddingScore * meanSim;
      const COMBINED_MIN = 0.4;
      if (combined < COMBINED_MIN) {

        bestPersonId = null;
        bestDisplayName = null;
      }
      effectiveScore = combined;
    }
  }

  const refPersonId = typeof state.speaker.confirmed === "number" ? state.speaker.confirmed : null;
  let landmarkVsRef: number | null = null;
  if (refPersonId != null && rtLandmark) {
    const refCand = result.matches.find((m) => m.personId === refPersonId);
    const refLandmarks = refCand?.landmarkRatiosList;
    if (refLandmarks && refLandmarks.length > 0) {
      const nonNull = refLandmarks.filter((l): l is Record<string, number> => l != null);
      if (nonNull.length > 0) {
        const sims = nonNull.map((saved) =>
          compareLandmarkRatios(rtLandmark, saved as unknown as LandmarkRatios),
        );
        landmarkVsRef = sims.reduce((a, b) => a + b, 0) / sims.length;
      }
    }
  }

  const cycle: MatchCycle = {
    personId: bestPersonId,
    displayName: bestDisplayName,

    score: bestPersonId != null ? effectiveScore : result.matches[0]?.score ?? 0,

    topPersonId: result.matches[0]?.personId ?? null,

    landmarkVsRef,
  };

  const { state: speaker, event } = speakerIdReducer(state.speaker, cycle, nowMs);
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

  getCurrentLandmark?: () => LandmarkRatios | null;

  cloneId: number;
  onEvent: (evt: SpeakerEvent) => void;

  onDiag?: (d: FaceDiag) => void;

  calibrate?: { accessToken: string; groundTruthPersonId: number | null } | null;

  onCollected?: (personId: number, vector: number[]) => void;

  deps?: IdentifyCycleDeps;

  now?: () => number;
}

export interface UseFaceIdentifyResult {

  onEmbedding: (raw: number[]) => void;

  getBuffer: () => EmbeddingBuffer;

  resetRecognition: () => void;
}

export function useFaceIdentify(opts: UseFaceIdentifyOptions): UseFaceIdentifyResult {
  const { enabled, accessToken, cloneId, onEvent, onDiag, calibrate, onCollected, getCurrentLandmark } = opts;
  const deps = useMemo<IdentifyCycleDeps>(
    () => opts.deps ?? { matchFaceFn: matchFace, getCurrentLandmark },
    [opts.deps, getCurrentLandmark],
  );
  const nowFn = opts.now ?? Date.now;

  const stateRef = useRef<IdentifyCycleState>(INITIAL_IDENTIFY_CYCLE_STATE);
  const bufferRef = useRef<EmbeddingBuffer>(new EmbeddingBuffer());
  const inFlightRef = useRef(false);

  const resetRecognition = useCallback(() => {

    const { state: speaker } = speakerIdReducer(
      stateRef.current.speaker,
      { type: "RESET_RECOGNITION" },
      nowFn(),
    );
    stateRef.current = { ...stateRef.current, speaker };
  }, [nowFn]);

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

          if (cycle) {
            console.log(`[useFaceIdentify] cycle personId=${cycle.personId ?? "null"} score=${cycle.score?.toFixed(3) ?? "?"} streak=${state.speaker.streak} onCollected=${!!onCollected}`);
          }

          const AUTO_ENROLL_MIN_SCORE = 0.75;   
          const AUTO_ENROLL_MIN_STREAK = 3;     
          if (
            onCollected &&
            cycle &&
            cycle.personId != null &&
            typeof cycle.score === "number" &&
            cycle.score >= AUTO_ENROLL_MIN_SCORE &&
            state.speaker.streak >= AUTO_ENROLL_MIN_STREAK
          ) {
            try {
              onCollected(cycle.personId, vec);
            } catch (err) {

              console.warn("[useFaceIdentify] onCollected threw:", err);
            }
          }

          if (FACE_DIAG_ENABLED && calibrate && cycle) {
            (deps.calibrateFn ?? calibrateFace)(
              calibrate.accessToken,
              vec,
              calibrate.groundTruthPersonId,
              cloneId,
            ).catch(() => {});
          }

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
                topPersonId: cycle.topPersonId ?? null,
                streak: diag.streak,
                verdict: diag.verdict,
                threshold: diag.threshold,
              })}`,
            );
          }
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    },

    [enabled, accessToken, cloneId, onEvent, onDiag, calibrate, deps, nowFn, onCollected],
  );

  return { onEmbedding, getBuffer: () => bufferRef.current, resetRecognition };
}
