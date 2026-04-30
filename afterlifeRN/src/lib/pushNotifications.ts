

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export interface PushRegistration {
  token: string | null;
  platform: "ios" | "android" | "web";
  granted: boolean;
}

export async function requestPushPermission(): Promise<PushRegistration> {
  const platform: PushRegistration["platform"] =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  if (!Device.isDevice) {
    return { token: null, platform, granted: false };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") {
    return { token: null, platform, granted: false };
  }

  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync();
    return { token: tokenRes.data, platform, granted: true };
  } catch {

    return { token: null, platform, granted: true };
  }
}
