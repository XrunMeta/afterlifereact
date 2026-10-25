

import { v_326be8 } from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import * as v_222528 from "objipkycgyawxjjk";
import * as v_fba5a0 from "hfxxehldoiokdq";
import { v_94c936 } from "../navigation/navigationRef";
import { v_1ed7d9 } from "../stores/authStore";

const v_c467bf = "processed_install_referrer_clone";
const v_55c9cc = "processed_clipboard_clone";
const v_bd631f = "pendingCloneShareId";

export async function v_f18f70(): Promise<void> {
  try {
    await v_e84827.removeItem(v_bd631f);
  } catch (v_49263d) {
    console.warn("[CloneShareDDL] clear pending 실패:", v_49263d);
  }
}

export async function v_1d7e9a(): Promise<void> {
  try {
    const v_479f05 = await v_e84827.getItem(v_bd631f);
    if (!v_479f05) return;
    const v_6e0fd3 = Number(v_479f05);
    if (!Number.isFinite(v_6e0fd3) || v_6e0fd3 <= 0) {
      await v_e84827.removeItem(v_bd631f);
      return;
    }
    await v_e84827.removeItem(v_bd631f);
    v_5b5900(v_6e0fd3);
  } catch (v_49263d) {
    console.warn("[CloneShareDDL] consume 실패:", v_49263d);
  }
}

function v_5b5900(v_6e0fd3) {
  const v_3c9f12 = v_94c936.current;
  if (!v_3c9f12?.isReady()) {

    void v_e84827.setItem(v_bd631f, String(v_6e0fd3));
    return;
  }
  try {

    (v_3c9f12.navigate as (name: string, params?: unknown) => void)("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId: v_6e0fd3 } },
    });
    console.log("[CloneShareDDL] CloneDetail 이동:", v_6e0fd3);
  } catch (v_49263d) {
    console.warn("[CloneShareDDL] navigate 실패:", v_49263d);
    void v_e84827.setItem(v_bd631f, String(v_6e0fd3));
  }
}

async function v_572259(): Promise<void> {
  if (v_326be8.OS !== "android") return;
  try {
    const v_23b320 = await v_222528.getInstallReferrerAsync();
    if (!v_23b320) return;

    const v_720567 = await v_e84827.getItem(v_c467bf);
    if (v_720567 === v_23b320) return;

    const v_24baff = new URLSearchParams(v_23b320);
    const v_a560de = v_24baff.get("utm_source");
    const v_2c9a0c = v_24baff.get("utm_content");

    if (v_a560de === "clone_share" && v_2c9a0c) {
      const v_6e0fd3 = Number(decodeURIComponent(v_2c9a0c));
      if (Number.isFinite(v_6e0fd3) && v_6e0fd3 > 0) {
        console.log("[CloneShareDDL] Android install referrer cloneId:", v_6e0fd3);
        await v_e84827.setItem(v_c467bf, v_23b320);
        await v_43576b(v_6e0fd3);
      }
    }
  } catch (v_49263d) {
    console.warn("[CloneShareDDL] Android install referrer 확인 실패:", v_49263d);
  }
}

async function v_07af55(): Promise<void> {
  if (v_326be8.OS !== "ios") return;
  try {
    const v_b43b74 = await v_fba5a0.getStringAsync();
    if (!v_b43b74 || !v_b43b74.startsWith("AFTERLIFE_CLONE:")) return;

    const v_720567 = await v_e84827.getItem(v_55c9cc);
    if (v_720567 === v_b43b74) return;

    const v_6e0fd3 = Number(v_b43b74.replace("AFTERLIFE_CLONE:", "").trim());
    if (!Number.isFinite(v_6e0fd3) || v_6e0fd3 <= 0) return;

    console.log("[CloneShareDDL] iOS 클립보드 cloneId:", v_6e0fd3);
    await v_e84827.setItem(v_55c9cc, v_b43b74);

    await v_fba5a0.setStringAsync("");
    await v_43576b(v_6e0fd3);
  } catch (v_49263d) {
    console.warn("[CloneShareDDL] iOS 클립보드 확인 실패:", v_49263d);
  }
}

async function v_43576b(v_6e0fd3): Promise<void> {
  const v_21cc31 = v_1ed7d9.getState().accessToken;
  if (v_21cc31) {

    v_5b5900(v_6e0fd3);
  } else {

    await v_e84827.setItem(v_bd631f, String(v_6e0fd3));
    console.log("[CloneShareDDL] pendingCloneShareId 저장:", v_6e0fd3);
  }
}

export function v_8237ac(): void {
  setTimeout(() => {
    void v_572259();
    void v_07af55();
  }, 3000);
}
