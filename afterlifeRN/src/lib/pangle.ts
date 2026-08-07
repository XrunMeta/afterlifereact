

import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const PANGLE_APP_ID_ANDROID = "8874759"; 
const PANGLE_APP_ID_IOS = "8874758";     
const REWARDED_AD_UNIT_ANDROID = "983489678"; 
const REWARDED_AD_UNIT_IOS = "983489670";     

type PangleModuleType = {
  initialize(): Promise<boolean>;
  isReady(): Promise<boolean>;
  loadRewardedAd(adUnitId: string): Promise<boolean>;
  showRewardedAd(adUnitId: string): Promise<boolean>;
};

const nativeModule = (NativeModules.PangleModule ?? null) as PangleModuleType | null;
const emitter = nativeModule ? new NativeEventEmitter(NativeModules.PangleModule) : null;

let initialized = false;
let initializing = false;

export async function initializePangle(): Promise<boolean> {
  if (initialized) return true;
  if (!nativeModule) {
    console.warn("[pangle] native module 없음 (Expo Go or JS-only). SKIP.");
    return false;
  }
  if (initializing) {

    for (let i = 0; i < 20 && initializing; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return initialized;
  }
  initializing = true;
  try {
    const ok = await nativeModule.initialize();
    initialized = ok;
    return ok;
  } catch (err) {
    console.warn("[pangle] initialize 실패:", err);
    return false;
  } finally {
    initializing = false;
  }
}

export function getPangleRewardedAdUnitId(): string {
  return Platform.OS === "ios" ? REWARDED_AD_UNIT_IOS : REWARDED_AD_UNIT_ANDROID;
}

export function getPangleAppId(): string {
  return Platform.OS === "ios" ? PANGLE_APP_ID_IOS : PANGLE_APP_ID_ANDROID;
}

export async function loadAndShowRewardedAd(adUnitId?: string): Promise<void> {
  if (!nativeModule || !emitter) {
    throw new Error("Pangle native module unavailable");
  }
  const ok = await initializePangle();
  if (!ok) throw new Error("Pangle init failed");
  const unit = adUnitId ?? getPangleRewardedAdUnitId();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      closeSub.remove();
      errSub.remove();
    };
    const closeSub = emitter.addListener("onRewardedAdClose", () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    });
    const errSub = emitter.addListener("onRewardedAdLoadError", (e: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Pangle load error: ${JSON.stringify(e)}`));
    });

    (async () => {
      try {
        await nativeModule.loadRewardedAd(unit);
        await nativeModule.showRewardedAd(unit);
      } catch (err) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      console.warn("[pangle] rewarded 타임아웃 — 5분 무반응");
      resolve();
    }, 5 * 60 * 1000);
  });
}
