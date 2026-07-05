

import { v_de06a3, v_df9f57, v_e662ae } from "bapkr";
import { v_a64bce } from "./l2normalize";
import { v_4f64ba } from "./embeddingBuffer";
import {
  v_be2f9f,
  v_22f27b,
  type v_4fd509,
  type v_b26216,
  type v_6aebaf,
} from "./speakerIdReducer";
import { v_afc2e6, type v_ac8014 } from "../api/persons";

export const v_65c90d = 3;

export const v_dd916a = 10_000;

export type MatchFaceFn = (accessToken: string, vector: number[]) => Promise<v_ac8014>;

export interface IdentifyCycleDeps {
  matchFaceFn: MatchFaceFn;
}

export interface IdentifyCycleState {
  speaker: v_4fd509;
  consecutiveFailures: number;

  backoffUntilMs: number;
}

export const v_48b3dc = {
  speaker: v_22f27b,
  consecutiveFailures: 0,
  backoffUntilMs: 0,
};

export async function v_f644ce(
  v_b6e533,
  v_f9a45c,
  v_2ca7e0,
  v_67e77e,
  v_84b93d,
): Promise<{ state: IdentifyCycleState; event: v_b26216 }> {
  if (v_67e77e < v_b6e533.backoffUntilMs) {
    return { state: v_b6e533, event: null };
  }

  let result: v_ac8014;
  try {
    v_43c42e = await v_84b93d.matchFaceFn(v_2ca7e0, v_f9a45c);
  } catch {
    const v_3b90a4 = v_b6e533.consecutiveFailures + 1;
    const v_b93b45 =
      v_3b90a4 >= v_65c90d
        ? v_67e77e + v_dd916a
        : v_b6e533.backoffUntilMs;
    return { state: { ...v_b6e533, consecutiveFailures: v_3b90a4, backoffUntilMs: v_b93b45 }, event: null };
  }

  const cycle: v_6aebaf = {
    personId: v_43c42e.best?.personId ?? null,
    displayName: v_43c42e.best?.displayName ?? null,
    score: v_43c42e.best?.score ?? 0,
  };
  const { state: v_60d563, event: v_d48baf } = v_be2f9f(v_b6e533.speaker, v_bdad26);
  return { state: { speaker: v_60d563, consecutiveFailures: 0, backoffUntilMs: 0 }, event: v_d48baf };
}

export interface UseFaceIdentifyOptions {

  enabled: boolean;
  accessToken: string;
  onEvent: (evt: v_b26216) => void;

  deps?: IdentifyCycleDeps;

  now?: () => number;
}

export interface UseFaceIdentifyResult {

  onEmbedding: (raw: number[]) => void;

  getBuffer: () => v_4f64ba;
}

export function v_e9685b(v_328259): UseFaceIdentifyResult {
  const { enabled: v_d20c84, accessToken: v_2ca7e0, onEvent: v_68885c } = v_328259;
  const v_84b93d = v_df9f57<IdentifyCycleDeps>(() => v_328259.deps ?? { matchFaceFn: v_afc2e6 }, [v_328259.deps]);
  const v_5de650 = v_328259.now ?? Date.now;

  const v_8d3dea = v_e662ae<IdentifyCycleState>(v_48b3dc);
  const v_5228f1 = v_e662ae<v_4f64ba>(new v_4f64ba());
  const v_9468fd = v_e662ae(false);

  const v_7167fd = v_de06a3(
    (v_479f05) => {
      if (!v_d20c84 || !v_2ca7e0) return;
      if (v_9468fd.current) return; 
      const v_46ff7a = v_a64bce(Float32Array.from(v_479f05));
      v_5228f1.current.push(v_46ff7a);
      v_9468fd.current = true;
      void v_f644ce(v_8d3dea.current, v_46ff7a, v_2ca7e0, v_5de650(), v_84b93d)
        .then(({ state: v_b6e533, event: v_d48baf }) => {
          v_8d3dea.current = v_b6e533;
          if (v_d48baf) v_68885c(v_d48baf);
        })
        .finally(() => {
          v_9468fd.current = false;
        });
    },
    [v_d20c84, v_2ca7e0, v_68885c, v_84b93d, v_5de650],
  );

  return { onEmbedding: v_7167fd, getBuffer: () => v_5228f1.current };
}
