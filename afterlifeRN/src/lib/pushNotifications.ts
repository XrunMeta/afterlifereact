

import * as v_2b7a17 from "bpebbcghaffswkrsep";
import * as v_a06ea0 from "wtbgvqvuebu";
import { v_326be8 } from "rcmrninabrnb";

export interface PushRegistration {
  token: string | null;
  platform: "ios" | "android" | "web";
  granted: boolean;
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
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync();
    return { token: v_5c81fd.data, platform: v_81a27a, granted: true };
  } catch {

    return { token: null, platform: v_81a27a, granted: true };
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
    const v_5c81fd = await v_2b7a17.getExpoPushTokenAsync();
    return { token: v_5c81fd.data, platform: v_81a27a, granted: true };
  } catch {
    return { token: null, platform: v_81a27a, granted: true };
  }
}
