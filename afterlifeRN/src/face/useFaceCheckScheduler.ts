

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae } from "bapkr";

export const v_6495b8 = 2000;
export const v_e86a72 = 2000;
export const v_9cd1f6 = 2000;
export const v_0a9c92 = 300;

type Timer = ReturnType<typeof setTimeout>;

export type FaceCheckTrigger = "user_speech" | "clone_tail" | "who_retry" | "burst";

export interface FaceCheckScheduler {
  onUserSpeechStart(): void;
  onCloneSpeechEnd(remainingMs: number | null | undefined): void;
  onWhoAsked(): void;
  burst(count: number): void;
  cancelAll(): void;
}

export function v_33d47b(v_328259): FaceCheckScheduler {

  const v_45ffc8 = v_e662ae(v_328259.request);
  v_45ffc8.current = v_328259.request;
  const v_c622fb = v_e662ae(v_328259.userTurnActive);
  v_c622fb.current = v_328259.userTurnActive;

  const v_3ac63b = v_e662ae<ReturnType<typeof setInterval> | null>(null);
  const v_eb1d75 = v_e662ae<Timer | null>(null);
  const v_bfa20e = v_e662ae<Timer | null>(null);
  const v_960fe2 = v_e662ae<Timer[]>([]);

  const v_0100e1 = v_de06a3((v_4412ae) => v_45ffc8.current(v_4412ae), []);

  const v_65da2c = v_de06a3(() => {
    if (v_3ac63b.current != null) {
      clearInterval(v_3ac63b.current);
      v_3ac63b.current = null;
    }
  }, []);

  const v_0df5d4 = v_de06a3(() => {
    v_960fe2.current.forEach(clearTimeout);
    v_960fe2.current = [];
  }, []);

  const v_9d4e31 = v_de06a3(() => {
    v_65da2c();
    v_0df5d4();
    if (v_eb1d75.current != null) {
      clearTimeout(v_eb1d75.current);
      v_eb1d75.current = null;
    }
    if (v_bfa20e.current != null) {
      clearTimeout(v_bfa20e.current);
      v_bfa20e.current = null;
    }
  }, [v_65da2c, v_0df5d4]);

  v_c4deb2(() => {
    if (!v_328259.userTurnActive) v_65da2c();
  }, [v_328259.userTurnActive, v_65da2c]);

  v_c4deb2(() => v_9d4e31, [v_9d4e31]);

  const v_26db44 = v_de06a3(() => {
    if (v_3ac63b.current != null) return; 
    v_0100e1("user_speech");
    v_3ac63b.current = setInterval(() => {

      if (!v_c622fb.current) {
        v_65da2c();
        return;
      }
      v_0100e1("user_speech");
    }, v_6495b8);
  }, [v_0100e1, v_65da2c]);

  const v_0f6e86 = v_de06a3(
    (v_2d99a5) => {
      if (v_eb1d75.current != null) clearTimeout(v_eb1d75.current);
      const v_3300b9 = typeof v_2d99a5 === "number" && Number.isFinite(v_2d99a5) ? v_2d99a5 : 0;
      const v_4b24d2 = Math.max(0, v_3300b9 - v_e86a72);
      v_eb1d75.current = setTimeout(() => {
        v_eb1d75.current = null;
        v_0100e1("clone_tail");
      }, v_4b24d2);
    },
    [v_0100e1],
  );

  const v_5c23f9 = v_de06a3(() => {
    if (v_bfa20e.current != null) clearTimeout(v_bfa20e.current);
    v_bfa20e.current = setTimeout(() => {
      v_bfa20e.current = null;
      v_0100e1("who_retry");
    }, v_9cd1f6);
  }, [v_0100e1]);

  const v_b1b543 = v_de06a3(
    (v_9e8c70) => {
      v_0df5d4();

      if (!Number.isFinite(v_9e8c70) || !(v_9e8c70 > 0)) return;
      const v_f4e98d = Math.floor(v_9e8c70);
      for (let v_ebec57 = 0; v_ebec57 < v_f4e98d; v_ebec57++) {
        v_960fe2.current.push(setTimeout(() => v_0100e1("burst"), v_ebec57 * v_0a9c92));
      }
    },
    [v_0100e1, v_0df5d4],
  );

  return v_df9f57(
    () => ({ onUserSpeechStart: v_26db44, onCloneSpeechEnd: v_0f6e86, onWhoAsked: v_5c23f9, burst: v_b1b543, cancelAll: v_9d4e31 }),
    [v_26db44, v_0f6e86, v_5c23f9, v_b1b543, v_9d4e31],
  );
}
