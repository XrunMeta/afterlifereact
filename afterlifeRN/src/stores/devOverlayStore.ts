

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "dev.callOverlays.visible";

export type CallHudKey = "devBox" | "timing" | "state" | "faceTrack";

export const CALL_HUD_ITEMS: ReadonlyArray<{ key: CallHudKey; label: string }> = [
  { key: "devBox", label: "route/face 박스" },
  { key: "state", label: "상태머신 HUD" },
  { key: "timing", label: "타이밍 HUD" },
  { key: "faceTrack", label: "얼굴 추적 HUD" },
];

export const CALL_HUD_DEFAULTS: Readonly<Record<CallHudKey, boolean>> = {
  devBox: true,
  state: false,
  timing: false,
  faceTrack: true,
};

export function hudStorageKey(key: CallHudKey): string {
  return `dev.callOverlays.hud.${key}`;
}

const ALL_HUD_KEYS = CALL_HUD_ITEMS.map((i) => i.key);

function allHudsOff(): Record<CallHudKey, boolean> {
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

export const useDevOverlayStore = create<State>((set, get) => ({
  callDevUiVisible: false,
  hudVisible: { ...CALL_HUD_DEFAULTS },
  hydrated: false,

  hydrate: async () => {
    if (!__DEV__) {

      set({ hydrated: true, callDevUiVisible: false, hudVisible: allHudsOff() });
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw === "1") set({ callDevUiVisible: true, hydrated: true });
      else if (raw === "0") set({ callDevUiVisible: false, hydrated: true });

      else set({ hydrated: true, callDevUiVisible: true });
    } catch {
      set({ hydrated: true });
    }

    const next: Record<CallHudKey, boolean> = { ...CALL_HUD_DEFAULTS };
    for (const key of ALL_HUD_KEYS) {
      try {
        const raw = await AsyncStorage.getItem(hudStorageKey(key));
        if (raw === "1") next[key] = true;
        else if (raw === "0") next[key] = false;

      } catch {

      }
    }
    set({ hudVisible: next });
  },

  setCallDevUiVisible: (on) => {
    if (!__DEV__) return;
    set({ callDevUiVisible: on });
    void AsyncStorage.setItem(KEY, on ? "1" : "0").catch(() => undefined);
  },

  toggleCallDevUiVisible: () => {
    get().setCallDevUiVisible(!get().callDevUiVisible);
  },

  setHudVisible: (key, on) => {
    if (!__DEV__) return;
    set({ hudVisible: { ...get().hudVisible, [key]: on } });
    void AsyncStorage.setItem(hudStorageKey(key), on ? "1" : "0").catch(() => undefined);
  },

  toggleHudVisible: (key) => {
    get().setHudVisible(key, !get().hudVisible[key]);
  },
}));

export function isCallDevUiVisible(): boolean {
  return __DEV__ && useDevOverlayStore.getState().callDevUiVisible;
}

export function isCallHudVisible(key: CallHudKey): boolean {
  const s = useDevOverlayStore.getState();
  return __DEV__ && s.callDevUiVisible && s.hudVisible[key] === true;
}

export function useCallHudVisible(key: CallHudKey): boolean {
  const master = useDevOverlayStore((s) => s.callDevUiVisible);
  const hud = useDevOverlayStore((s) => s.hudVisible[key]);
  return __DEV__ && master && hud === true;
}
