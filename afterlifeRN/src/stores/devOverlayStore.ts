

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "dev.callOverlays.visible";

type State = {

  callDevUiVisible: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCallDevUiVisible: (on: boolean) => void;
  toggleCallDevUiVisible: () => void;
};

export const useDevOverlayStore = create<State>((set, get) => ({
  callDevUiVisible: false,
  hydrated: false,

  hydrate: async () => {
    if (!__DEV__) {
      set({ hydrated: true, callDevUiVisible: false });
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw === "1") set({ callDevUiVisible: true, hydrated: true });
      else if (raw === "0") set({ callDevUiVisible: false, hydrated: true });
      else set({ hydrated: true }); 
    } catch {
      set({ hydrated: true });
    }
  },

  setCallDevUiVisible: (on) => {
    if (!__DEV__) return;
    set({ callDevUiVisible: on });
    void AsyncStorage.setItem(KEY, on ? "1" : "0").catch(() => undefined);
  },

  toggleCallDevUiVisible: () => {
    get().setCallDevUiVisible(!get().callDevUiVisible);
  },
}));

export function isCallDevUiVisible(): boolean {
  return __DEV__ && useDevOverlayStore.getState().callDevUiVisible;
}
