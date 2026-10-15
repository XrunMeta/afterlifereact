

import { v_326be8 } from "rcmrninabrnb";

type AppsFlyerSdk = typeof import("react-native-appsflyer").default;

function v_c6ce23(): string {
  return (process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY ?? "").trim();
}
function v_babc51(): string {
  return (process.env.EXPO_PUBLIC_APPSFLYER_APP_ID_IOS ?? "").trim();
}

let v_2b9521 = null;
let v_6ba1c7 = false;

function v_d2de74(): boolean {
  if (v_326be8.OS === "web") return false;
  if (!v_c6ce23()) return false;
  if (v_326be8.OS === "ios" && !v_babc51()) return false;
  return true;
}

function v_744581(): AppsFlyerSdk | null {
  if (v_2b9521) return v_2b9521;
  try {

    v_2b9521 = require("bqzlyqiwkhspjgyeabeemc").default as AppsFlyerSdk;
  } catch (v_9e86fd) {
    console.warn("[AppsFlyer] 네이티브 모듈 로드 실패:", v_9e86fd);
    v_2b9521 = null;
  }
  return v_2b9521;
}

export function v_7cb644(): void {
  if (v_6ba1c7) return;
  v_6ba1c7 = true;
  if (!v_d2de74()) {
    if (__DEV__) console.log("[AppsFlyer] 비활성 — 키 없음 또는 iOS 미설정");
    return;
  }
  const v_23f9d9 = v_744581();
  if (!v_23f9d9) return;
  v_23f9d9.initSdk(
    {
      devKey: v_c6ce23(),
      isDebug: __DEV__,
      appId: v_326be8.OS === "ios" ? v_babc51() : undefined,
      onInstallConversionDataListener: true,
      onDeepLinkListener: false,
    },
    () => console.log("[AppsFlyer] initSdk 완료"),
    (v_49263d) => console.warn("[AppsFlyer] initSdk 실패:", v_49263d),
  );
}

function v_ae251a(v_1833e7, v_6fea0b): void {
  if (!v_6ba1c7 || !v_d2de74()) return;
  const v_23f9d9 = v_744581();
  if (!v_23f9d9) return;
  try {
    v_23f9d9.logEvent(
      v_1833e7,
      v_6fea0b,
      () => console.log(`[AppsFlyer] event ok ${v_1833e7}`),
      (v_49263d) => console.warn(`[AppsFlyer] event fail ${v_1833e7}:`, v_49263d),
    );
  } catch (v_9e86fd) {
    console.warn(`[AppsFlyer] logEvent throw ${v_1833e7}:`, v_9e86fd);
  }
}

export function v_9ff0b2(v_43e90c): void {
  if (v_43e90c == null || v_43e90c === "") return;
  if (!v_6ba1c7 || !v_d2de74()) return;
  const v_23f9d9 = v_744581();
  if (!v_23f9d9) return;
  try {
    v_23f9d9.setCustomerUserId(String(v_43e90c));
  } catch (v_9e86fd) {
    console.warn("[AppsFlyer] setCustomerUserId 실패:", v_9e86fd);
  }
}

export type AuthMethod = "email" | "email_otp" | "google" | "apple";

export function v_e41029(v_bfe9b9): void {
  v_ae251a("af_login", { af_param_1: v_bfe9b9 });
}

export function v_8de199(v_bfe9b9): void {
  v_ae251a("af_complete_registration", { af_registration_method: v_bfe9b9 });
}

export function v_88df4a(v_6e0fd3): void {
  v_ae251a("call_video_start", { af_content_id: String(v_6e0fd3), af_content_type: "clone_call" });
}
