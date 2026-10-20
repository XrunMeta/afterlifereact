

import { v_f2c756, v_326be8 } from "rcmrninabrnb";

const v_23f6c6 = "https://www.xrun.run";

export interface OpenXrunOptions {
  email?: string;
  signup?: boolean;
}

export async function v_0c2802(v_328259 = {}): Promise<void> {
  const { email: v_e0c7e8, signup: v_35200c } = v_328259;
  const v_24baff = [];
  if (v_e0c7e8) v_24baff.push(`email=${encodeURIComponent(v_e0c7e8)}`);
  if (v_35200c) v_24baff.push("signup=1");
  v_24baff.push("from=afterlife");
  const v_9fe22d = v_35200c ? "/signup" : "/";
  const v_f71b56 = `${v_23f6c6}${v_9fe22d}?${v_24baff.join("&")}`;

  console.log("[openXrunApp] opening:", v_f71b56);
  try {
    await v_f2c756.openURL(v_f71b56);
  } catch (v_49263d) {
    console.warn("[openXrunApp] openURL failed:", v_49263d);
  }
}

const v_182162 = "xrun://wallet/afterlife";
const v_024b5e = "https://apps.apple.com/kr/app/xrun-go/id6502924173";
const v_b0adfa = "market://details?id=run.xrun.xrunapp";
const v_04606d = "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";

export async function v_77a9ad(): Promise<boolean> {
  try {
    await v_f2c756.openURL(v_182162);
    return true;
  } catch {
    try {
      await v_f2c756.openURL(v_326be8.OS === "ios" ? v_024b5e : v_b0adfa);
    } catch {
      await v_f2c756.openURL(v_04606d).catch(() => {});
    }
    return false;
  }
}
