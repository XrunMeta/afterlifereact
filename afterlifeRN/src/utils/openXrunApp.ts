

import { Linking, Platform } from "react-native";

const XRUN_SCHEME = "xrun://";
const XRUN_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
const XRUN_APP_STORE_URL = "https://apps.apple.com/app/id1492389867";
const XRUN_APP_STORE_SEARCH = "https://apps.apple.com/search?term=xrun";

export interface OpenXrunOptions {
  email?: string;
  signup?: boolean;
}

export async function openXrunApp(opts: OpenXrunOptions = {}): Promise<void> {
  const { email, signup } = opts;
  const params: string[] = [];
  if (email) params.push(`email=${encodeURIComponent(email)}`);
  if (signup) params.push("signup=1");
  params.push("from=afterlife");
  const deepLink = `${XRUN_SCHEME}?${params.join("&")}`;

  try {
    await Linking.openURL(deepLink);
    return;
  } catch (err) {
    console.warn("[openXrunApp] deepLink failed, falling back to store:", err);
  }

  const storeUrl =
    Platform.OS === "android" ? XRUN_PLAY_STORE_URL : XRUN_APP_STORE_URL;
  try {
    await Linking.openURL(storeUrl);
    return;
  } catch (err) {
    console.warn("[openXrunApp] store failed:", err);
  }
  if (Platform.OS === "ios") {
    Linking.openURL(XRUN_APP_STORE_SEARCH).catch(() => {});
  }
}
