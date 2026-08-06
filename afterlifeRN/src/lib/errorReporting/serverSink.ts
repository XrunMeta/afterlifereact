

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import * as Localization from "expo-localization";
import { API_BASE } from "../../config/apiBase";
import { useAuthStore } from "../../stores/authStore";
import type { ErrorReport } from "./report";
import type { SafeBreadcrumb } from "./scrub";

function extractLastScreen(breadcrumbs: SafeBreadcrumb[]): string | null {
  for (let i = breadcrumbs.length - 1; i >= 0; i--) {
    const b = breadcrumbs[i];
    if (b?.category === "navigation" && typeof b.message === "string" && b.message.length) {
      return b.message.slice(0, 200);
    }
  }
  return null;
}

function collectMeta(): {
  appVersion?: string;
  runtimeVersion?: string;
  updateId?: string;
  channel?: string;
  platform: "ios" | "android" | "web" | "unknown";
  osVersion: string;
  deviceModel?: string;
  locale?: string;
} {
  let updateId: string | undefined;
  let runtimeVersion: string | undefined;
  let channel: string | undefined;
  try {
    updateId = Updates.updateId ?? undefined;
    runtimeVersion = (Updates.runtimeVersion as string | undefined) ?? undefined;
    channel = (Updates.channel as string | undefined) ?? undefined;
  } catch {

  }
  const platform: "ios" | "android" | "web" | "unknown" =
    Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web"
      ? Platform.OS
      : "unknown";
  return {
    appVersion: Constants.expoConfig?.version,
    runtimeVersion,
    updateId,
    channel,
    platform,
    osVersion: String(Platform.Version),
    deviceModel: Constants.deviceName ?? undefined,
    locale: Localization.getLocales()?.[0]?.languageTag,
  };
}

export function serverSink(report: ErrorReport): void {
  const meta = collectMeta();
  const screen = extractLastScreen(report.breadcrumbs);
  const token = useAuthStore.getState().accessToken;

  const payload = {
    ts: report.ts,
    isFatal: !!report.isFatal,
    message: report.message,
    name: report.name,
    stack: report.stack,
    screen: screen ?? undefined,
    breadcrumbs: report.breadcrumbs,
    extra: report.extra,
    ...meta,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  fetch(`${API_BASE}/oth-path`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {

  });
}
