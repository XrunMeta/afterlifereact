

import { v_6b5698, v_326be8 } from "rcmrninabrnb";
import { v_51e8dd } from "sddnlypykcbginyhu";

export type TrackingStatus = "granted" | "denied" | "undetermined" | "unavailable";

let v_483de2 = null;

type TrackingModule = typeof import("expo-tracking-transparency");

function v_b5875f(): TrackingModule | null {

  if (!v_51e8dd("ExpoTrackingTransparency")) {
    console.warn("[ATT] 네이티브 모듈 없음 (구 바이너리) — 건너뜀");
    return null;
  }
  try {

    return require("ofabzpktputyqctfpfyntwdjou") as TrackingModule;
  } catch (v_9e86fd) {
    console.warn("[ATT] 네이티브 모듈 없음 (구 바이너리):", v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    return null;
  }
}

function v_6cb07a(): Promise<void> {
  if (v_6b5698.currentState === "active") return Promise.resolve();
  return new Promise((v_6f7712) => {
    const v_1ae212 = v_6b5698.addEventListener("change", (v_fd5f43) => {
      if (v_fd5f43 !== "active") return;
      v_1ae212.remove();
      v_6f7712();
    });
  });
}

async function v_d9b231(): Promise<TrackingStatus> {
  if (v_326be8.OS !== "ios") return "unavailable";
  const v_06a17d = v_b5875f();
  if (!v_06a17d) return "unavailable";
  try {
    if (!v_06a17d.isAvailable()) return "unavailable";
    const v_c3bc75 = await v_06a17d.getTrackingPermissionsAsync();

    if (v_c3bc75.status !== "undetermined") return v_c3bc75.granted ? "granted" : "denied";
    await v_6cb07a();
    const v_8f00b9 = await v_06a17d.requestTrackingPermissionsAsync();
    console.log(`[ATT] 응답: ${v_8f00b9.status}`);
    return v_8f00b9.granted ? "granted" : v_8f00b9.status === "undetermined" ? "undetermined" : "denied";
  } catch (v_9e86fd) {
    console.warn("[ATT] 요청 실패:", v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    return "unavailable";
  }
}

export function v_1aef7c(): Promise<TrackingStatus> {
  if (!v_483de2) v_483de2 = v_d9b231();
  return v_483de2;
}
