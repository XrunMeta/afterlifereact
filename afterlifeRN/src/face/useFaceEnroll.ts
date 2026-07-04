

import { v_de06a3, v_e662ae, v_5ab095 } from "bapkr";
import { v_4e7b87, v_31967f, v_4585d1 } from "../api/persons";
import type { v_4f64ba } from "./embeddingBuffer";

export const v_9e3bb7 = 3;

export const v_98b500 = "in_call_proxy";

export type FaceEnrollStatus = "idle" | "enrolling" | "success" | "error";

export interface FaceEnrollDeps {
  createPersonFn: typeof v_4e7b87;
  saveFaceConsentFn: typeof v_31967f;
  enrollFacesFn: typeof v_4585d1;
}

const v_17f880 = {
  createPersonFn: v_4e7b87,
  saveFaceConsentFn: v_31967f,
  enrollFacesFn: v_4585d1,
};

export interface UseFaceEnrollOptions {
  accessToken: string;

  getBuffer: () => v_4f64ba;

  getSnapshot?: () => number[][] | null;

  deps?: FaceEnrollDeps;
}

export interface UseFaceEnrollResult {
  status: FaceEnrollStatus;
  error: Error | null;

  enroll: (name: string) => Promise<void>;

  reset: () => void;

  getPendingPersonId: () => number | null;
}

export function v_3fc8fd(v_328259): UseFaceEnrollResult {
  const { accessToken: v_2ca7e0, getBuffer: v_b84ee1, getSnapshot: v_172c9f } = v_328259;
  const v_84b93d = v_328259.deps ?? v_17f880;
  const [v_d308b5, v_5193f8] = v_5ab095<FaceEnrollStatus>("idle");
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);

  const v_9d3e9b = v_e662ae<{ id: number } | null>(null);
  const v_9dac17 = v_e662ae(false);

  const v_28ec48 = v_e662ae(false);

  const v_298ecf = v_de06a3(
    async (v_1833e7) => {
      if (v_28ec48.current) return; 
      v_28ec48.current = true;
      v_5193f8("enrolling");
      v_3a7d09(null);
      try {
        let v_306a28 = v_9d3e9b.current;
        if (!v_306a28) {
          v_306a28 = await v_84b93d.createPersonFn(v_2ca7e0, { displayName: v_1833e7 });
          v_9d3e9b.current = v_306a28;
        }
        if (!v_9dac17.current) {
          await v_84b93d.saveFaceConsentFn(v_2ca7e0, v_306a28.id, "granted", {
            channel: v_98b500,
          });
          v_9dac17.current = true;
        }
        const v_5392c4 = v_172c9f?.() ?? null;
        if (v_5392c4 == null) {
          console.warn(
            "[useFaceEnroll] getSnapshot 미제공/null — getBuffer() 현재값으로 폴백(오염 가능성 있음)",
          );
        }
        const v_f94e64 = v_5392c4 ?? v_b84ee1().latest(v_9e3bb7);
        await v_84b93d.enrollFacesFn(v_2ca7e0, v_306a28.id, v_f94e64);
        v_5193f8("success");
      } catch (v_9e86fd) {
        v_5193f8("error");
        v_3a7d09(v_9e86fd as Error);
      } finally {
        v_28ec48.current = false;
      }
    },
    [v_2ca7e0, v_b84ee1, v_172c9f, v_84b93d],
  );

  const v_487a25 = v_de06a3(() => {
    v_5193f8("idle");
    v_3a7d09(null);
    v_9d3e9b.current = null;
    v_9dac17.current = false;
  }, []);

  const v_2ceab1 = v_de06a3((): number | null => {
    if (v_d308b5 === "success" || v_d308b5 === "idle") return null;
    return v_9d3e9b.current?.id ?? null;
  }, [v_d308b5]);

  return { status: v_d308b5, error: v_5e9bfe, enroll: v_298ecf, reset: v_487a25, getPendingPersonId: v_2ceab1 };
}
