

import { v_326be8 } from "rcmrninabrnb";
import v_c9be60 from "qfrscldecidiqs";
import * as v_087631 from "iokyqncutdfy";
import * as v_d3fd07 from "xhvnyifvzueidzwls";
import { v_cc9198 } from "../../config/apiBase";
import { v_1ed7d9 } from "../../stores/authStore";
import type { v_c16e89 } from "./report";
import type { v_213abd } from "./scrub";

function v_5bd30f(breadcrumbs: v_213abd[]): string | null {
  for (let v_ebec57 = v_951be3.length - 1; v_ebec57 >= 0; v_ebec57--) {
    const v_148ff6 = v_951be3[v_ebec57];
    if (v_148ff6?.category === "navigation" && typeof v_148ff6.message === "string" && v_148ff6.message.length) {
      return v_148ff6.message.slice(0, 200);
    }
  }
  return null;
}

function v_3515ba(): {
  appVersion?: string;
  runtimeVersion?: string;
  updateId?: string;
  channel?: string;
  platform: "ios" | "android" | "web" | "unknown";
  osVersion: string;
  deviceModel?: string;
  locale?: string;
} {
  let v_2d19f2;
  let v_1c83f0;
  let v_8e9fad;
  try {
    v_2d19f2 = v_087631.updateId ?? undefined;
    v_1c83f0 = (v_087631.runtimeVersion as string | undefined) ?? undefined;
    v_8e9fad = (v_087631.channel as string | undefined) ?? undefined;
  } catch {

  }
  const v_81a27a =
    v_326be8.OS === "ios" || v_326be8.OS === "android" || v_326be8.OS === "web"
      ? v_326be8.OS
      : "unknown";
  return {
    appVersion: v_c9be60.expoConfig?.version,
    runtimeVersion: v_1c83f0,
    updateId: v_2d19f2,
    channel: v_8e9fad,
    platform: v_81a27a,
    osVersion: String(v_326be8.Version),
    deviceModel: v_c9be60.deviceName ?? undefined,
    locale: v_d3fd07.getLocales()?.[0]?.languageTag,
  };
}

export function v_04fed4(report: v_c16e89): void {
  const v_ab4c96 = v_3515ba();
  const v_53746a = v_5bd30f(v_2888b4.breadcrumbs);
  const v_21cc31 = v_1ed7d9.getState().accessToken;

  const v_931bf0 = {
    ts: v_2888b4.ts,
    isFatal: !!v_2888b4.isFatal,
    message: v_2888b4.message,
    name: v_2888b4.name,
    stack: v_2888b4.stack,
    screen: v_53746a ?? undefined,
    breadcrumbs: v_2888b4.breadcrumbs,
    extra: v_2888b4.extra,
    ...v_ab4c96,
  };

  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_21cc31) v_3f4675["Authorization"] = `Bearer ${v_21cc31}`;

  fetch(`${v_cc9198}/oth-path`, {
    method: "POST",
    headers: v_3f4675,
    body: JSON.stringify(v_931bf0),
    keepalive: true,
  }).catch(() => {

  });
}
