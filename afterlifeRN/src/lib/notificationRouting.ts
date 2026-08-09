

import { navigationRef } from "../navigation/navigationRef";
import { useAuthStore } from "../stores/authStore";

type UnknownRecord = Record<string, unknown>;

let pending: UnknownRecord | null = null;

export function routeFromNotificationData(data: UnknownRecord | null | undefined): void {
  if (!data) return;
  if (!navigationRef.isReady()) {
    pending = data;
    return;
  }
  try {
    dispatch(data);
  } catch (err) {
    console.warn("[notificationRouting] dispatch failed:", (err as Error).message);
  }
}

export function flushPendingNotificationRoute(): void {
  if (!pending) return;
  if (!navigationRef.isReady()) return;
  const data = pending;
  pending = null;
  try {
    dispatch(data);
  } catch (err) {
    console.warn("[notificationRouting] flush failed:", (err as Error).message);
  }
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function dispatch(data: UnknownRecord): void {

  const nav = navigationRef as unknown as { navigate: (name: string, params?: unknown) => void };
  const type = typeof data.type === "string" ? data.type : "";
  const url = typeof data.url === "string" ? data.url : "";
  const cloneId = toNum(data.cloneId);
  const followerId = toNum(data.followerId);

  if (type === "clone_gift") {
    nav.navigate("Main", {
      screen: "MyTab",
      params: { screen: "Purchase" },
    });
    return;
  }

  if (
    type === "clone_like" ||
    type === "clone_comment" ||
    type === "clone_follow"
  ) {
    if (cloneId > 0) {
      const tab =
        type === "clone_like"
          ? "likes"
          : type === "clone_comment"
            ? "comments"
            : "followers";
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: cloneId, openStatsTab: tab },
        },
      });
      return;
    }
  }

  if (type === "user_follow") {
    const myId = useAuthStore.getState().apiUser?.id;
    if (myId) {
      nav.navigate("UserFollowList", { userId: myId, mode: "followers" });
      return;
    }
  }

  if (type === "followee_new_clone" && cloneId > 0) {
    nav.navigate("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId } },
    });
    return;
  }

  if (type === "intimacy_score" || /^afterlife:\/\/clone\/\d+\/intimacy/.test(url)) {
    const cid = cloneId > 0 ? cloneId : Number(url.match(/clone\/(\d+)/)?.[1] ?? 0);
    if (cid > 0) {
      nav.navigate("Main", {
        screen: "ShortsTab",
        params: { openIntimacyCloneId: cid },
      });
      return;
    }
  }

  if (type === "moderation" || url.startsWith("afterlife://reports")) {
    nav.navigate("Main", {
      screen: "MyTab",
      params: { screen: "Reports", params: { tab: "received" } },
    });
    return;
  }

  const inviteMatch = url.match(/^afterlife:\/\/invite\/(.+)$/);
  if (inviteMatch) {
    nav.navigate("InviteAccept", { token: decodeURIComponent(inviteMatch[1]!) });
    return;
  }
  if (type === "invite_received" && typeof data.token === "string") {
    nav.navigate("InviteAccept", { token: data.token });
    return;
  }

  const userMatch = url.match(/^afterlife:\/\/oth-path\/(\d+)/);
  if (userMatch) {
    nav.navigate("UserProfile", { userId: Number(userMatch[1]) });
    return;
  }
  if (followerId > 0) {
    nav.navigate("UserProfile", { userId: followerId });
    return;
  }

  const cloneMatch = url.match(/^afterlife:\/\/clone\/(\d+)/);
  const targetClone = cloneMatch ? Number(cloneMatch[1]) : cloneId;
  if (targetClone > 0) {
    nav.navigate("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId: targetClone } },
    });
  }
}
