

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
import { matchFace, type MatchResult } from "../api/persons";

export const NETWORK_FAIL_BACKOFF_THRESHOLD = 3;

export const NETWORK_FAIL_BACKOFF_MS = 10_000;

export type MatchFaceFn = (accessToken: string, vector: number[]) => Promise<MatchResult>;

export interface IdentifyCycleDeps {
  matchFaceFn: MatchFaceFn;
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
  nowMs: number,
  deps: IdentifyCycleDeps,
): Promise<{ state: IdentifyCycleState; event: SpeakerEvent }> {
  if (nowMs < state.backoffUntilMs) {
    return { state, event: null };
  }

  let result: MatchResult;
  try {
    result = await deps.matchFaceFn(accessToken, vector);
  } catch {
    const consecutiveFailures = state.consecutiveFailures + 1;
    const backoffUntilMs =
      consecutiveFailures >= NETWORK_FAIL_BACKOFF_THRESHOLD
        ? nowMs + NETWORK_FAIL_BACKOFF_MS
        : state.backoffUntilMs;
    return { state: { ...state, consecutiveFailures, backoffUntilMs }, event: null };
  }

  const cycle: MatchCycle = {
    personId: result.best?.personId ?? null,
    displayName: result.best?.displayName ?? null,
    score: result.best?.score ?? 0,
  };
  const { state: speaker, event } = speakerIdReducer(state.speaker, cycle);
  return { state: { speaker, consecutiveFailures: 0, backoffUntilMs: 0 }, event };
}

export interface UseFaceIdentifyOptions {

  enabled: boolean;
  accessToken: string;
  onEvent: (evt: SpeakerEvent) => void;

  deps?: IdentifyCycleDeps;

  now?: () => number;
}

export interface UseFaceIdentifyResult {

  onEmbedding: (raw: number[]) => void;

  getBuffer: () => EmbeddingBuffer;
}

export function useFaceIdentify(opts: UseFaceIdentifyOptions): UseFaceIdentifyResult {
  const { enabled, accessToken, onEvent } = opts;
  const deps = useMemo<IdentifyCycleDeps>(() => opts.deps ?? { matchFaceFn: matchFace }, [opts.deps]);
  const nowFn = opts.now ?? Date.now;

  const stateRef = useRef<IdentifyCycleState>(INITIAL_IDENTIFY_CYCLE_STATE);
  const bufferRef = useRef<EmbeddingBuffer>(new EmbeddingBuffer());
  const inFlightRef = useRef(false);

  const onEmbedding = useCallback(
    (raw: number[]) => {
      if (!enabled || !accessToken) return;
      if (inFlightRef.current) return; 
      const vec = l2normalize(Float32Array.from(raw));
      bufferRef.current.push(vec);
      inFlightRef.current = true;
      void runIdentifyCycle(stateRef.current, vec, accessToken, nowFn(), deps)
        .then(({ state, event }) => {
          stateRef.current = state;
          if (event) onEvent(event);
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    },
    [enabled, accessToken, onEvent, deps, nowFn],
  );

  return { onEmbedding, getBuffer: () => bufferRef.current };
}
