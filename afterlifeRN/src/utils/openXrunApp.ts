

import { v_f2c756, v_326be8 } from "rcmrninabrnb";

const v_6847f9 = "xrun://open";
const v_afac13 =
  "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
const v_8220cd = "https://apps.apple.com/app/id1492389867";
const v_15fd6d = "https://apps.apple.com/search?term=xrun";

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
  const v_6045c3 = `${v_6847f9}?${v_24baff.join("&")}`;

  console.log("[openXrunApp] opening:", v_6045c3);
  try {
    await v_f2c756.openURL(v_6045c3);
    return;
  } catch (v_49263d) {
    console.warn("[openXrunApp] deepLink failed, falling back to store:", v_49263d);
  }

  let v_b71a74;
  if (v_326be8.OS === "android") {
    if (v_e0c7e8 && v_35200c) {
      const v_6d4ed3 = `utm_source=afterlife_signup&utm_content=${encodeURIComponent(v_e0c7e8)}`;
      v_b71a74 = `${v_afac13}&referrer=${encodeURIComponent(v_6d4ed3)}`;
    } else {
      v_b71a74 = v_afac13;
    }
  } else {
    v_b71a74 = v_8220cd;
  }
  try {
    await v_f2c756.openURL(v_b71a74);
    return;
  } catch (v_49263d) {
    console.warn("[openXrunApp] store failed:", v_49263d);
  }
  if (v_326be8.OS === "ios") {
    v_f2c756.openURL(v_15fd6d).catch(() => {});
  }
}
