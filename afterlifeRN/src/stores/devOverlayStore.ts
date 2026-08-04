

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_a7c0d4 } from "vukrcww";

const v_d9b84e = "dev.callOverlays.visible";

type State = {

  callDevUiVisible: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCallDevUiVisible: (on: boolean) => void;
  toggleCallDevUiVisible: () => void;
};

export const v_434962 = v_a7c0d4<State>((v_bb8024, v_38715b) => ({
  callDevUiVisible: false,
  hydrated: false,

  hydrate: async () => {
    if (!__DEV__) {
      v_bb8024({ hydrated: true, callDevUiVisible: false });
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
  },

  setCallDevUiVisible: (v_abacaa) => {
    if (!__DEV__) return;
    v_bb8024({ callDevUiVisible: v_abacaa });
    void v_e84827.setItem(v_d9b84e, v_abacaa ? "1" : "0").catch(() => undefined);
  },

  toggleCallDevUiVisible: () => {
    v_38715b().setCallDevUiVisible(!v_38715b().callDevUiVisible);
  },
}));

export function v_e9eef8(): boolean {
  return __DEV__ && v_434962.getState().callDevUiVisible;
}
