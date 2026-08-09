

import { v_80fa10, v_0cafec, v_326be8 } from "rcmrninabrnb";

const v_a4f114 = "8874759"; 
const v_cfcd6e = "8874758";     
const v_9f718b = "983489678"; 
const v_c7628e = "983489670";     

type PangleModuleType = {
  initialize(): Promise<boolean>;
  isReady(): Promise<boolean>;
  loadRewardedAd(adUnitId: string): Promise<boolean>;
  showRewardedAd(adUnitId: string): Promise<boolean>;
};

const v_d57f84 = (v_80fa10.PangleModule ?? null) as PangleModuleType | null;
const v_357489 = v_d57f84 ? new v_0cafec(v_80fa10.PangleModule) : null;

let v_c9f274 = false;
let v_d40535 = false;

export async function v_f095b0(): Promise<boolean> {
  if (v_c9f274) return true;
  if (!v_d57f84) {
    console.warn("[pangle] native module 없음 (Expo Go or JS-only). SKIP.");
    return false;
  }
  if (v_d40535) {

    for (let v_ebec57 = 0; v_ebec57 < 20 && v_d40535; v_ebec57++) {
      await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 100));
    }
    return v_c9f274;
  }
  v_d40535 = true;
  try {
    const v_3ed4c3 = await v_d57f84.initialize();
    v_c9f274 = v_3ed4c3;
    return v_3ed4c3;
  } catch (v_49263d) {
    console.warn("[pangle] initialize 실패:", v_49263d);
    return false;
  } finally {
    v_d40535 = false;
  }
}

export function v_3dc1fd(): string {
  return v_326be8.OS === "ios" ? v_c7628e : v_9f718b;
}

export function v_8dbaf4(): string {
  return v_326be8.OS === "ios" ? v_cfcd6e : v_a4f114;
}

export async function v_18f201(v_61418d): Promise<void> {
  if (!v_d57f84 || !v_357489) {
    throw new Error("Pangle native module unavailable");
  }
  const v_3ed4c3 = await v_f095b0();
  if (!v_3ed4c3) throw new Error("Pangle init failed");
  const v_80cae9 = v_61418d ?? v_3dc1fd();

  return new Promise<void>((v_6f7712, v_bad6f3) => {
    let v_35db80 = false;
    const v_a983d4 = () => {
      v_8d364c.remove();
      v_ac7dac.remove();
    };
    const v_8d364c = v_357489.addListener("onRewardedAdClose", () => {
      if (v_35db80) return;
      v_35db80 = true;
      v_a983d4();
      v_6f7712();
    });
    const v_ac7dac = v_357489.addListener("onRewardedAdLoadError", (v_9e86fd) => {
      if (v_35db80) return;
      v_35db80 = true;
      v_a983d4();
      v_bad6f3(new Error(`Pangle load error: ${JSON.stringify(v_9e86fd)}`));
    });

    (async () => {
      try {
        await v_d57f84.loadRewardedAd(v_80cae9);
        await v_d57f84.showRewardedAd(v_80cae9);
      } catch (v_49263d) {
        if (v_35db80) return;
        v_35db80 = true;
        v_a983d4();
        v_bad6f3(v_49263d instanceof Error ? v_49263d : new Error(String(v_49263d)));
      }
    })();

    setTimeout(() => {
      if (v_35db80) return;
      v_35db80 = true;
      v_a983d4();
      console.warn("[pangle] rewarded 타임아웃 — 5분 무반응");
      v_6f7712();
    }, 5 * 60 * 1000);
  });
}
