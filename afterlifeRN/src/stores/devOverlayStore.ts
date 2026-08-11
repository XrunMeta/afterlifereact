

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_a7c0d4 } from "vukrcww";

const v_d9b84e = "dev.callOverlays.visible";

export type CallHudKey = "devBox" | "timing" | "state" | "faceTrack";

export const v_a1183f = [
  { key: "devBox", label: "route/face 박스" },
  { key: "state", label: "상태머신 HUD" },
  { key: "timing", label: "타이밍 HUD" },
  { key: "faceTrack", label: "얼굴 추적 HUD" },
];

export const v_828022 = {
  devBox: true,
  state: false,
  timing: false,
  faceTrack: true,
};

export function v_0cef44(v_b24339): string {
  return `dev.callOverlays.hud.${v_b24339}`;
}

const v_63e5ff = v_a1183f.map((v_ebec57) => v_ebec57.key);

function v_1f2989(): Record<CallHudKey, boolean> {
  return { devBox: false, state: false, timing: false, faceTrack: false };
}

type State = {

  callDevUiVisible: boolean;

  hudVisible: Record<CallHudKey, boolean>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCallDevUiVisible: (on: boolean) => void;
  toggleCallDevUiVisible: () => void;
  setHudVisible: (key: CallHudKey, on: boolean) => void;
  toggleHudVisible: (key: CallHudKey) => void;
};

export const v_434962 = v_a7c0d4<State>((v_bb8024, v_38715b) => ({
  callDevUiVisible: false,
  hudVisible: { ...v_828022 },
  hydrated: false,

  hydrate: async () => {
    if (!__DEV__) {

      v_bb8024({ hydrated: true, callDevUiVisible: false, hudVisible: v_1f2989() });
      return;
    }
    try {
      const v_479f05 = await v_e84827.getItem(v_d9b84e);
      if (v_479f05 === "1") v_bb8024({ callDevUiVisible: true, hydrated: true });
      else if (v_479f05 === "0") v_bb8024({ callDevUiVisible: false, hydrated: true });
      else v_bb8024({ hydrated: true }); 
    } catch {
      v_bb8024({ hydrated: true });
    }

    const v_a448ad = { ...v_828022 };
    for (const v_b24339 of v_63e5ff) {
      try {
        const v_479f05 = await v_e84827.getItem(v_0cef44(v_b24339));
        if (v_479f05 === "1") v_a448ad[v_b24339] = true;
        else if (v_479f05 === "0") v_a448ad[v_b24339] = false;

      } catch {

      }
    }
    v_bb8024({ hudVisible: v_a448ad });
  },

  setCallDevUiVisible: (v_abacaa) => {
    if (!__DEV__) return;
    v_bb8024({ callDevUiVisible: v_abacaa });
    void v_e84827.setItem(v_d9b84e, v_abacaa ? "1" : "0").catch(() => undefined);
  },

  toggleCallDevUiVisible: () => {
    v_38715b().setCallDevUiVisible(!v_38715b().callDevUiVisible);
  },

  setHudVisible: (v_b24339, v_abacaa) => {
    if (!__DEV__) return;
    v_bb8024({ hudVisible: { ...v_38715b().hudVisible, [v_b24339]: v_abacaa } });
    void v_e84827.setItem(v_0cef44(v_b24339), v_abacaa ? "1" : "0").catch(() => undefined);
  },

  toggleHudVisible: (v_b24339) => {
    v_38715b().setHudVisible(v_b24339, !v_38715b().hudVisible[v_b24339]);
  },
}));

export function v_e9eef8(): boolean {
  return __DEV__ && v_434962.getState().callDevUiVisible;
}

export function v_5c17ef(v_b24339): boolean {
  const v_fd5f43 = v_434962.getState();
  return __DEV__ && v_fd5f43.callDevUiVisible && v_fd5f43.hudVisible[v_b24339] === true;
}

export function v_a72dc4(v_b24339): boolean {
  const v_01f419 = v_434962((v_fd5f43) => v_fd5f43.callDevUiVisible);
  const v_b976e3 = v_434962((v_fd5f43) => v_fd5f43.hudVisible[v_b24339]);
  return __DEV__ && v_01f419 && v_b976e3 === true;
}
