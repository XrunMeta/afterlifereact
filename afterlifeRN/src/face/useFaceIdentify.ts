

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
import { v_afc2e6, v_383262, type v_ac8014 } from "../api/persons";
import { v_f9bbe6, type v_90e668 } from "./faceLandmarkRatios";
import { v_55dbc4, type v_8a6b56, type v_71bfaa } from "../config/faceDiag";

export const v_65c90d = 3;

export const v_dd916a = 10_000;

export type MatchFaceFn = (accessToken: string, vector: number[], cloneId: number) => Promise<v_ac8014>;

export type CalibrateFaceFn = (
  accessToken: string,
  vector: number[],
  groundTruthPersonId: number | null,
  cloneId: number,
) => ReturnType<typeof v_383262>;

export interface IdentifyCycleDeps {
  matchFaceFn: MatchFaceFn;

  calibrateFn?: CalibrateFaceFn;

  getCurrentLandmark?: () => Record<string, number> | null;
}

export function v_10735f(v_b48d3d): v_71bfaa {
  if (v_b48d3d.confirmed === "unknown") return "unknown"; 
  if (v_b48d3d.confirmed !== "none") return "confirmed"; 
  if (v_b48d3d.candidate != null && v_b48d3d.streak > 0) return "candidate";
  return "none";
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
  v_6e0fd3,
  v_67e77e,
  v_84b93d,
): Promise<{
  state: IdentifyCycleState;
  event: v_b26216;

  cycle: v_6aebaf | null;

  threshold: number | null;
}> {
  if (v_67e77e < v_b6e533.backoffUntilMs) {
    return { state: v_b6e533, event: null, cycle: null, threshold: null };
  }

  let result: v_ac8014;
  try {
    v_43c42e = await v_84b93d.matchFaceFn(v_2ca7e0, v_f9a45c, v_6e0fd3);
  } catch {
    const v_3b90a4 = v_b6e533.consecutiveFailures + 1;
    const v_b93b45 =
      v_3b90a4 >= v_65c90d
        ? v_67e77e + v_dd916a
        : v_b6e533.backoffUntilMs;
    return { state: { ...v_b6e533, consecutiveFailures: v_3b90a4, backoffUntilMs: v_b93b45 }, event: null, cycle: null, threshold: null };
  }

  let v_d2fcdb = v_43c42e.best?.personId ?? null;
  let v_14f856 = v_43c42e.best?.displayName ?? null;
  const v_d15b72 = v_43c42e.best?.score ?? v_43c42e.matches[0]?.score ?? 0;
  let v_7f9794 = v_d15b72;

  const v_20e745 = v_84b93d.getCurrentLandmark?.();
  const v_63e1ab = v_43c42e.best?.landmarkRatiosList;
  if (v_d2fcdb != null && v_20e745 && v_63e1ab && v_63e1ab.length > 0) {
    const v_f2d98f = v_63e1ab.filter((v_1614db): v_1614db is Record<string, number> => v_1614db != null);
    if (v_f2d98f.length > 0) {
      const v_b552b6 = v_f2d98f.map((v_39de0e) =>
        v_f9bbe6(v_20e745 as v_90e668, v_39de0e as v_90e668),
      );
      const v_1f22f7 = v_b552b6.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0) / v_b552b6.length;

      const v_e75c90 = v_d15b72 * v_1f22f7;
      const v_aa1c73 = 0.5; 
      if (v_e75c90 < v_aa1c73) {

        v_d2fcdb = null;
        v_14f856 = null;
      }
      v_7f9794 = v_e75c90;
    }
  }

  const cycle: v_6aebaf = {
    personId: v_d2fcdb,
    displayName: v_14f856,

    score: v_d2fcdb != null ? v_7f9794 : v_43c42e.matches[0]?.score ?? 0,
  };

  const { state: v_60d563, event: v_d48baf } = v_be2f9f(v_b6e533.speaker, v_bdad26, v_67e77e);
  return {
    state: { speaker: v_60d563, consecutiveFailures: 0, backoffUntilMs: 0 },
    event: v_d48baf,
    cycle: v_bdad26,
    threshold: v_43c42e.threshold,
  };
}

export interface UseFaceIdentifyOptions {

  enabled: boolean;
  accessToken: string;

  getCurrentLandmark?: () => Record<string, number> | null;

  cloneId: number;
  onEvent: (evt: v_b26216) => void;

  onDiag?: (d: v_8a6b56) => void;

  calibrate?: { accessToken: string; groundTruthPersonId: number | null } | null;

  onCollected?: (personId: number, vector: number[]) => void;

  deps?: IdentifyCycleDeps;

  now?: () => number;
}

export interface UseFaceIdentifyResult {

  onEmbedding: (raw: number[]) => void;

  getBuffer: () => v_4f64ba;

  resetRecognition: () => void;
}

export function v_e9685b(v_328259): UseFaceIdentifyResult {
  const { enabled: v_d20c84, accessToken: v_2ca7e0, cloneId: v_6e0fd3, onEvent: v_68885c, onDiag: v_32837c, calibrate: v_faccce, onCollected: v_d23335, getCurrentLandmark: v_bed13d } = v_328259;
  const v_84b93d = v_df9f57<IdentifyCycleDeps>(
    () => v_328259.deps ?? { matchFaceFn: v_afc2e6, getCurrentLandmark: v_bed13d },
    [v_328259.deps, v_bed13d],
  );
  const v_5de650 = v_328259.now ?? Date.now;

  const v_8d3dea = v_e662ae<IdentifyCycleState>(v_48b3dc);
  const v_5228f1 = v_e662ae<v_4f64ba>(new v_4f64ba());
  const v_9468fd = v_e662ae(false);

  const v_4921f9 = v_de06a3(() => {

    const { state: v_60d563 } = v_be2f9f(
      v_8d3dea.current.speaker,
      { type: "RESET_RECOGNITION" },
      v_5de650(),
    );
    v_8d3dea.current = { ...v_8d3dea.current, speaker: v_60d563 };
  }, [v_5de650]);

  const v_7167fd = v_de06a3(
    (v_479f05) => {
      if (!v_d20c84 || !v_2ca7e0) return;
      if (v_9468fd.current) return; 
      const v_46ff7a = v_a64bce(Float32Array.from(v_479f05));
      v_5228f1.current.push(v_46ff7a);
      v_9468fd.current = true;
      void v_f644ce(v_8d3dea.current, v_46ff7a, v_2ca7e0, v_6e0fd3, v_5de650(), v_84b93d)
        .then(({ state: v_b6e533, event: v_d48baf, cycle: v_bdad26, threshold: v_d361d7 }) => {
          v_8d3dea.current = v_b6e533;
          if (v_d48baf) v_68885c(v_d48baf);

          if (v_bdad26) {
            console.log(`[useFaceIdentify] cycle personId=${v_bdad26.personId ?? "null"} score=${v_bdad26.score?.toFixed(3) ?? "?"} streak=${v_b6e533.speaker.streak} onCollected=${!!v_d23335}`);
          }

          const v_c4d427 = 0.75;   
          const v_a079c5 = 3;     
          if (
            v_d23335 &&
            v_bdad26 &&
            v_bdad26.personId != null &&
            typeof v_bdad26.score === "number" &&
            v_bdad26.score >= v_c4d427 &&
            v_b6e533.speaker.streak >= v_a079c5
          ) {
            try {
              v_d23335(v_bdad26.personId, v_46ff7a);
            } catch (v_49263d) {

              console.warn("[useFaceIdentify] onCollected threw:", v_49263d);
            }
          }

          if (v_55dbc4 && v_faccce && v_bdad26) {
            (v_84b93d.calibrateFn ?? v_383262)(
              v_faccce.accessToken,
              v_46ff7a,
              v_faccce.groundTruthPersonId,
              v_6e0fd3,
            ).catch(() => {});
          }

          if (v_55dbc4 && v_bdad26 && v_d361d7 != null) {
            const diag: v_8a6b56 = {
              score: v_bdad26.score,
              personId: v_bdad26.personId,
              displayName: v_bdad26.displayName,
              streak: v_b6e533.speaker.streak,
              verdict: v_10735f(v_b6e533.speaker),
              threshold: v_d361d7,
            };
            v_32837c?.(v_ef2205);

            console.log(
              `[FACEDIAG] ${JSON.stringify({
                ts: v_5de650(),
                score: v_ef2205.score,
                personId: v_ef2205.personId,
                streak: v_ef2205.streak,
                verdict: v_ef2205.verdict,
                threshold: v_ef2205.threshold,
              })}`,
            );
          }
        })
        .finally(() => {
          v_9468fd.current = false;
        });
    },

    [v_d20c84, v_2ca7e0, v_6e0fd3, v_68885c, v_32837c, v_faccce, v_84b93d, v_5de650, v_d23335],
  );

  return { onEmbedding: v_7167fd, getBuffer: () => v_5228f1.current, resetRecognition: v_4921f9 };
}
