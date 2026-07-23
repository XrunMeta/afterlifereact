

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_BASE } from "../config/apiBase";
import { getOrCreateDeviceId } from "./deviceId";

Notifications.setNotificationHandler({
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

function getProjectId(): string | undefined {
  const expoConfig = Constants.expoConfig as
    | { extra?: { eas?: { projectId?: string } } }
    | null
    | undefined;
  const easConfig = (Constants as unknown as {
    easConfig?: { projectId?: string };
  }).easConfig;
  return expoConfig?.extra?.eas?.projectId ?? easConfig?.projectId;
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
    const projectId = getProjectId();
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { token: tokenRes.data, platform, granted: true };
  } catch (err) {

    console.warn("[push] getExpoPushTokenAsync failed:", (err as Error)?.message ?? err);
    return { token: null, platform, granted: true };
  }
}

export async function registerPushTokenIfReady(accessToken: string | null): Promise<void> {
  if (!accessToken) return;
  if (!Device.isDevice) return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = getProjectId();
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenRes.data;
    if (!token) return;

    const deviceId = await getOrCreateDeviceId();
    const platform: PushRegistration["platform"] =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

    const res = await fetch(`${API_BASE}/oth-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ deviceId, pushToken: token, platform }),
    });
    if (!res.ok) {
      console.warn("[push] device upsert failed:", res.status);
      return;
    }
    console.log("[push] device upserted, token=", token.slice(0, 30) + "...");
  } catch (err) {
    console.warn("[push] registerPushTokenIfReady failed:", (err as Error)?.message ?? err);
  }
}

export async function getCurrentPushStatus(): Promise<PushRegistration> {
  const platform: PushRegistration["platform"] =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  if (!Device.isDevice) {
    return { token: null, platform, granted: false };
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status !== "granted") {
    return { token: null, platform, granted: false };
  }

  try {
    const projectId = getProjectId();
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { token: tokenRes.data, platform, granted: true };
  } catch (err) {
    console.warn("[push] getExpoPushTokenAsync failed:", (err as Error)?.message ?? err);
    return { token: null, platform, granted: true };
  }
}
