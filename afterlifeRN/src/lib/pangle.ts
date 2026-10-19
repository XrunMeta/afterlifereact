

import { v_80fa10, v_0cafec, v_326be8 } from "rcmrninabrnb";
import { v_51e8dd } from "tgjb";

const v_a4f114 = "8874759"; 
const v_cfcd6e = "8874758";     
const v_9f718b = "983489678"; 
const v_c7628e = "983489670";     

const v_9f4c5f = "983760615";
const v_a4a845 = "983741036";
export function v_60086b(): string {
  return v_326be8.OS === "ios" ? v_a4a845 : v_9f4c5f;
}

type PangleModuleType = {
  initialize(): Promise<boolean>;
  isReady(): Promise<boolean>;
  loadRewardedAd(adUnitId: string): Promise<boolean>;
  showRewardedAd(adUnitId: string): Promise<boolean>;
};

type EmitterLike = { addListener(event: string, cb: (e: unknown) => void): { remove(): void } };
const v_6272aa =
  v_326be8.OS === "ios"
    ? (v_51e8dd("PangleModule") as (PangleModuleType & EmitterLike) | null)
    : null;
const v_d57f84 = (v_326be8.OS === "ios" ? v_6272aa : (v_80fa10.PangleModule ?? null)) as PangleModuleType | null;
const v_357489 =
  v_326be8.OS === "ios"
    ? v_6272aa
    : v_d57f84
      ? new v_0cafec(v_80fa10.PangleModule)
      : null;

let v_c9f274 = false;
let v_d40535 = false;

const v_126e05 = true;
function v_4b0422(v_badeaf, v_f91f33): void {
  if (!v_126e05) return;
  const v_8d41d7 = new Date().toISOString().slice(11, 23); 
  if (v_f91f33 !== undefined) console.log(`[pangle][diag ${v_8d41d7}] ${v_badeaf}`, v_f91f33);
  else console.log(`[pangle][diag ${v_8d41d7}] ${v_badeaf}`);
}

const v_4b24d2 = (v_d799e2) => new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, v_d799e2));

export type AdStubEvent = "loading" | "loaded" | "showed" | "reward" | "close";

export function v_36f8a3(): boolean {
  const v_8b5cd8 = process.env.EXPO_PUBLIC_AD_STUB;
  if (v_8b5cd8 === "1") return true;
  if (v_8b5cd8 === "0") return false;
  return typeof __DEV__ !== "undefined" && __DEV__ === true;
}

function v_9fd782(): number {
  const v_f4e98d = Number(process.env.EXPO_PUBLIC_AD_STUB_MS);
  return Number.isFinite(v_f4e98d) && v_f4e98d > 0 ? v_f4e98d : 10000; 
}

export async function v_cdacfb(
  v_68885c = () => {},
  v_b98005 = v_9fd782(),
): Promise<void> {
  v_68885c("loading");
  await v_4b24d2(300); 
  v_68885c("loaded");
  v_68885c("showed"); 
  await v_4b24d2(v_b98005); 
  v_68885c("reward"); 
  v_68885c("close"); 
}

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
  const v_b66f2c = Date.now();
  const v_a48992 = () => `+${Date.now() - v_b66f2c}ms`;
  v_4b0422(`loadAndShowRewardedAd() 호출 · nativeModule=${!!v_d57f84} emitter=${!!v_357489} platform=${v_326be8.OS} stub=${v_36f8a3()}`);

  if (v_36f8a3()) {
    v_4b0422(`STUB MODE on — 실광고 대신 시뮬레이션(${v_9fd782()}ms)`);
    await v_cdacfb((v_9e86fd) => v_4b0422(`[stub] event ${v_9e86fd} (${v_a48992()})`));
    v_4b0422(`STUB MODE 완료 — close 상당 지점 resolve (${v_a48992()})`);
    return;
  }

  if (!v_d57f84 || !v_357489) {
    v_4b0422("native module/emitter 없음 → throw (Expo Go 또는 JS-only 빌드)");
    throw new Error("Pangle native module unavailable");
  }
  const v_3ed4c3 = await v_f095b0();
  v_4b0422(`initializePangle() → ${v_3ed4c3} (${v_a48992()})`);
  if (!v_3ed4c3) throw new Error("Pangle init failed");
  const v_80cae9 = v_61418d ?? v_3dc1fd();
  v_4b0422(`adUnit=${v_80cae9}`);

  return new Promise<void>((v_6f7712, v_bad6f3) => {
    let v_35db80 = false;
    const v_a983d4 = () => {
      v_8d364c.remove();
      v_ac7dac.remove();
      v_cabbf3.remove();
    };
    const v_8d364c = v_357489.addListener("onRewardedAdClose", (v_9e86fd) => {
      v_4b0422(`event onRewardedAdClose (${v_a48992()})`, v_9e86fd);
      if (v_35db80) return;
      v_35db80 = true;
      v_a983d4();
      v_6f7712();
    });
    const v_ac7dac = v_357489.addListener("onRewardedAdLoadError", (v_9e86fd) => {

      const v_94d701 = (v_9e86fd as { errorCode?: unknown } | null)?.errorCode;
      const v_131f0d = (v_9e86fd as { errorMsg?: unknown } | null)?.errorMsg;
      v_4b0422(`event onRewardedAdLoadError (${v_a48992()}) errorCode=${String(v_94d701)} errorMsg=${String(v_131f0d)}`, v_9e86fd);
      if (v_35db80) return;
      v_35db80 = true;
      v_a983d4();
      v_bad6f3(new Error(`Pangle load error: ${JSON.stringify(v_9e86fd)}`));
    });

    const v_cabbf3 = v_357489.addListener("onRewardedAdReward", (v_9e86fd) => {
      v_4b0422(`event onRewardedAdReward (${v_a48992()})`, v_9e86fd);
    });

    (async () => {
      try {
        v_4b0422(`loadRewardedAd(${v_80cae9}) 시작`);
        await v_d57f84.loadRewardedAd(v_80cae9);
        v_4b0422(`loadRewardedAd 성공 (${v_a48992()}) → showRewardedAd 시작`);
        await v_d57f84.showRewardedAd(v_80cae9);
        v_4b0422(`showRewardedAd 성공 (${v_a48992()}) — 광고 표시됨, close 대기`);
      } catch (v_49263d) {
        v_4b0422(`load/show 예외 (${v_a48992()}): ${(v_49263d as Error)?.message ?? String(v_49263d)}`);
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
      v_4b0422(`rewarded 타임아웃 — 5분 무반응 (${v_a48992()}) 강제 resolve`);
      console.warn("[pangle] rewarded 타임아웃 — 5분 무반응");
      v_6f7712();
    }, 5 * 60 * 1000);
  });
}
