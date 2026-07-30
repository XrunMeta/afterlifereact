

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import { navigationRef } from "../navigation/navigationRef";
import { useAuthStore } from "../stores/authStore";

const PROCESSED_KEY_ANDROID = "processed_install_referrer_clone";
const PROCESSED_KEY_IOS = "processed_clipboard_clone";
const PENDING_KEY = "pendingCloneShareId";

export async function consumePendingCloneShare(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const cloneId = Number(raw);
    if (!Number.isFinite(cloneId) || cloneId <= 0) {
      await AsyncStorage.removeItem(PENDING_KEY);
      return;
    }
    await AsyncStorage.removeItem(PENDING_KEY);
    navigateToClone(cloneId);
  } catch (err) {
    console.warn("[CloneShareDDL] consume 실패:", err);
  }
}

function navigateToClone(cloneId: number) {
  const nav = navigationRef.current;
  if (!nav?.isReady()) {

    void AsyncStorage.setItem(PENDING_KEY, String(cloneId));
    return;
  }
  try {

    nav.navigate("Main" as never, {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId } },
    } as never);
    console.log("[CloneShareDDL] CloneDetail 이동:", cloneId);
  } catch (err) {
    console.warn("[CloneShareDDL] navigate 실패:", err);
    void AsyncStorage.setItem(PENDING_KEY, String(cloneId));
  }
}

async function checkAndroidInstallReferrer(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const installReferrer = await Application.getInstallReferrerAsync();
    if (!installReferrer) return;

    const processed = await AsyncStorage.getItem(PROCESSED_KEY_ANDROID);
    if (processed === installReferrer) return;

    const params = new URLSearchParams(installReferrer);
    const utmSource = params.get("utm_source");
    const utmContent = params.get("utm_content");

    if (utmSource === "clone_share" && utmContent) {
      const cloneId = Number(decodeURIComponent(utmContent));
      if (Number.isFinite(cloneId) && cloneId > 0) {
        console.log("[CloneShareDDL] Android install referrer cloneId:", cloneId);
        await AsyncStorage.setItem(PROCESSED_KEY_ANDROID, installReferrer);
        await handleIncomingCloneId(cloneId);
      }
    }
  } catch (err) {
    console.warn("[CloneShareDDL] Android install referrer 확인 실패:", err);
  }
}

async function checkIosClipboard(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    const content = await Clipboard.getStringAsync();
    if (!content || !content.startsWith("AFTERLIFE_CLONE:")) return;

    const processed = await AsyncStorage.getItem(PROCESSED_KEY_IOS);
    if (processed === content) return;

    const cloneId = Number(content.replace("AFTERLIFE_CLONE:", "").trim());
    if (!Number.isFinite(cloneId) || cloneId <= 0) return;

    console.log("[CloneShareDDL] iOS 클립보드 cloneId:", cloneId);
    await AsyncStorage.setItem(PROCESSED_KEY_IOS, content);

    await Clipboard.setStringAsync("");
    await handleIncomingCloneId(cloneId);
  } catch (err) {
    console.warn("[CloneShareDDL] iOS 클립보드 확인 실패:", err);
  }
}

async function handleIncomingCloneId(cloneId: number): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  if (token) {

    navigateToClone(cloneId);
  } else {

    await AsyncStorage.setItem(PENDING_KEY, String(cloneId));
    console.log("[CloneShareDDL] pendingCloneShareId 저장:", cloneId);
  }
}

export function initCloneShareDeferredLink(): void {
  setTimeout(() => {
    void checkAndroidInstallReferrer();
    void checkIosClipboard();
  }, 3000);
}
