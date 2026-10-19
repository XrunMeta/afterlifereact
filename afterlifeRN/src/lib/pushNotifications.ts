

import * as v_2b7a17 from "bpebbcghaffswkrsep";
import * as v_a06ea0 from "wtbgvqvuebu";
import v_c9be60 from "qfrscldecidiqs";
import { v_326be8 } from "rcmrninabrnb";
import { v_cc9198 } from "../config/apiBase";
import { v_ea1c99 } from "./deviceId";

v_2b7a17.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

export async function v_6d7a3d(): Promise<boolean> {
  if (!v_a06ea0.isDevice) return false;
  const v_3c8572 = await v_2b7a17.getPermissionsAsync();
  return v_3c8572.status === "granted";
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

export async function v_9bedf5(
  v_2ca7e0,
  v_328259 = {},
): Promise<void> {

  console.log(`[push] register start — platform=${v_326be8.OS} isDevice=${v_a06ea0.isDevice} hasToken=${!!v_2ca7e0}`);
  if (!v_2ca7e0) { console.log("[push] SKIP: no accessToken"); return; }
  if (!v_a06ea0.isDevice) { console.log("[push] SKIP: Device.isDevice=false (simulator?)"); return; }

  try {
    const v_3c8572 = await v_2b7a17.getPermissionsAsync();
    console.log(`[push] permission status=${v_3c8572.status} granted=${v_3c8572.granted} canAskAgain=${v_3c8572.canAskAgain}`);
    let v_d308b5 = v_3c8572.status;
    if (v_d308b5 !== "granted" && v_328259.ask && v_3c8572.canAskAgain) {
      if (v_326be8.OS === "android") {

        await v_2b7a17.setNotificationChannelAsync("default", {
          name: "default",
          importance: v_2b7a17.AndroidImportance.DEFAULT,
        });
      }
      v_d308b5 = (await v_2b7a17.requestPermissionsAsync()).status;
      console.log(`[push] permission requested → ${v_d308b5}`);
    }
    if (v_d308b5 !== "granted") { console.log("[push] SKIP: permission not granted"); return; }

    if (v_326be8.OS === "android") {
      await v_2b7a17.setNotificationChannelAsync("default", {
        name: "default",
        importance: v_2b7a17.AndroidImportance.DEFAULT,
      });
      console.log("[push] android channel set");
    }

    const v_06e736 = v_2e9678();
    console.log(`[push] projectId=${v_06e736 ?? "(none)"}`);
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync(
      v_06e736 ? { projectId: v_06e736 } : undefined,
    );
    const v_21cc31 = v_5c81fd.data;
    console.log(`[push] got expo token — prefix=${v_21cc31 ? v_21cc31.slice(0, 30) : "(null)"}`);
    if (!v_21cc31) { console.log("[push] SKIP: no token from getExpoPushTokenAsync"); return; }

    const v_929b58 = await v_ea1c99();
    const v_81a27a =
      v_326be8.OS === "ios" ? "ios" : v_326be8.OS === "android" ? "android" : "web";

    console.log(`[push] POST /oth-path deviceId=${v_929b58} platform=${v_81a27a}`);
    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${v_2ca7e0}`,
      },
      body: JSON.stringify({ deviceId: v_929b58, pushToken: v_21cc31, platform: v_81a27a }),
    });
    if (!v_8f00b9.ok) {
      const v_4d33b2 = await v_8f00b9.text().catch(() => "");
      console.warn(`[push] device upsert failed status=${v_8f00b9.status} body=${v_4d33b2.slice(0, 200)}`);
      return;
    }
    console.log(`[push] ✅ device upserted OK — platform=${v_81a27a} token=${v_21cc31.slice(0, 30)}...`);
  } catch (v_49263d) {
    console.warn("[push] registerPushTokenIfReady EXCEPTION:", (v_49263d as Error)?.message ?? v_49263d);
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
