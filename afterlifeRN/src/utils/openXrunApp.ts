

import { Linking } from "react-native";

const XRUN_WEB_BASE = "https://www.xrun.run";

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
  const path = signup ? "/signup" : "/";
  const url = `${XRUN_WEB_BASE}${path}?${params.join("&")}`;

  console.log("[openXrunApp] opening:", url);
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn("[openXrunApp] openURL failed:", err);
  }
}
