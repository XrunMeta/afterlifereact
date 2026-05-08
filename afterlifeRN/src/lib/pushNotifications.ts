

import * as v_2b7a17 from "bpebbcghaffswkrsep";
import * as v_a06ea0 from "wtbgvqvuebu";
import v_c9be60 from "qfrscldecidiqs";
import { v_326be8 } from "rcmrninabrnb";
import { v_cc9198 } from "../config/apiBase";
import { v_ea1c99 } from "./deviceId";

export interface PushRegistration {
  token: string | null;
  platform: "ios" | "android" | "web";
  granted: boolean;
}

function v_2e9678(): string | undefined {
  const v_3e8cd8 = v_c9be60.expoConfig as
    | { extra?: { eas?: { projectId?: string } } }
    | null
    | undefined;
  const v_292e7d = (v_c9be60 as unknown as {
    easConfig?: { projectId?: string };
  }).easConfig;
  return v_3e8cd8?.extra?.eas?.projectId ?? v_292e7d?.projectId;
}

export async function v_704bef(): Promise<PushRegistration> {
  const v_81a27a =
    v_326be8.OS === "ios" ? "ios" : v_326be8.OS === "android" ? "android" : "web";

  if (!v_a06ea0.isDevice) {
    return { token: null, platform: v_81a27a, granted: false };
  }

  if (v_326be8.OS === "android") {
    await v_2b7a17.setNotificationChannelAsync("default", {
      name: "default",
      importance: v_2b7a17.AndroidImportance.DEFAULT,
    });
  }

  const v_3c8572 = await v_2b7a17.getPermissionsAsync();
  let v_d308b5 = v_3c8572.status;
  if (v_d308b5 !== "granted") {
    const v_309144 = await v_2b7a17.requestPermissionsAsync();
    v_d308b5 = v_309144.status;
  }
  if (v_d308b5 !== "granted") {
    return { token: null, platform: v_81a27a, granted: false };
  }

  try {
    const v_06e736 = v_2e9678();
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync(
      v_06e736 ? { projectId: v_06e736 } : undefined,
    );
    return { token: v_5c81fd.data, platform: v_81a27a, granted: true };
  } catch (v_49263d) {

    console.warn("[push] getExpoPushTokenAsync failed:", (v_49263d as Error)?.message ?? v_49263d);
    return { token: null, platform: v_81a27a, granted: true };
  }
}

export async function v_9bedf5(v_2ca7e0): Promise<void> {
  if (!v_2ca7e0) return;
  if (!v_a06ea0.isDevice) return;

  try {
    const v_3c8572 = await v_2b7a17.getPermissionsAsync();
    if (v_3c8572.status !== "granted") return;

    if (v_326be8.OS === "android") {
      await v_2b7a17.setNotificationChannelAsync("default", {
        name: "default",
        importance: v_2b7a17.AndroidImportance.DEFAULT,
      });
    }

    const v_06e736 = v_2e9678();
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync(
      v_06e736 ? { projectId: v_06e736 } : undefined,
    );
    const v_21cc31 = v_5c81fd.data;
    if (!v_21cc31) return;

    const v_929b58 = await v_ea1c99();
    const v_81a27a =
      v_326be8.OS === "ios" ? "ios" : v_326be8.OS === "android" ? "android" : "web";

    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${v_2ca7e0}`,
      },
      body: JSON.stringify({ deviceId: v_929b58, pushToken: v_21cc31, platform: v_81a27a }),
    });
    if (!v_8f00b9.ok) {
      console.warn("[push] device upsert failed:", v_8f00b9.status);
      return;
    }
    console.log("[push] device upserted, token=", v_21cc31.slice(0, 30) + "...");
  } catch (v_49263d) {
    console.warn("[push] registerPushTokenIfReady failed:", (v_49263d as Error)?.message ?? v_49263d);
  }
}

export async function v_11921f(): Promise<PushRegistration> {
  const v_81a27a =
    v_326be8.OS === "ios" ? "ios" : v_326be8.OS === "android" ? "android" : "web";

  if (!v_a06ea0.isDevice) {
    return { token: null, platform: v_81a27a, granted: false };
  }

  const v_3c8572 = await v_2b7a17.getPermissionsAsync();
  if (v_3c8572.status !== "granted") {
    return { token: null, platform: v_81a27a, granted: false };
  }

  try {
    const v_06e736 = v_2e9678();
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync(
      v_06e736 ? { projectId: v_06e736 } : undefined,
    );
    return { token: v_5c81fd.data, platform: v_81a27a, granted: true };
  } catch (v_49263d) {
    console.warn("[push] getExpoPushTokenAsync failed:", (v_49263d as Error)?.message ?? v_49263d);
    return { token: null, platform: v_81a27a, granted: true };
  }
}
