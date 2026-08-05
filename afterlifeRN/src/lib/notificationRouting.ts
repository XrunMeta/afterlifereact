

import { v_94c936 } from "../navigation/navigationRef";
import { v_1ed7d9 } from "../stores/authStore";

type UnknownRecord = Record<string, unknown>;

let v_483de2 = null;

export function v_798ed3(v_9390e8): void {
  if (!v_9390e8) return;
  if (!v_94c936.isReady()) {
    v_483de2 = v_9390e8;
    return;
  }
  try {
    v_6be210(v_9390e8);
  } catch (v_49263d) {
    console.warn("[notificationRouting] dispatch failed:", (v_49263d as Error).message);
  }
}

export function v_125d64(): void {
  if (!v_483de2) return;
  if (!v_94c936.isReady()) return;
  const v_9390e8 = v_483de2;
  v_483de2 = null;
  try {
    v_6be210(v_9390e8);
  } catch (v_49263d) {
    console.warn("[notificationRouting] flush failed:", (v_49263d as Error).message);
  }
}

function v_1e3ec7(v_81e2ef): number {
  if (typeof v_81e2ef === "number") return v_81e2ef;
  if (typeof v_81e2ef === "string") {
    const v_f4e98d = Number(v_81e2ef);
    return Number.isFinite(v_f4e98d) ? v_f4e98d : 0;
  }
  return 0;
}

function v_6be210(v_9390e8): void {

  const v_3c9f12 = v_94c936 as unknown as { navigate: (name: string, params?: unknown) => void };
  const v_3b27d9 = typeof v_9390e8.type === "string" ? v_9390e8.type : "";
  const v_f71b56 = typeof v_9390e8.url === "string" ? v_9390e8.url : "";
  const v_6e0fd3 = v_1e3ec7(v_9390e8.cloneId);
  const v_baf950 = v_1e3ec7(v_9390e8.followerId);

  if (
    v_3b27d9 === "clone_like" ||
    v_3b27d9 === "clone_comment" ||
    v_3b27d9 === "clone_gift" ||
    v_3b27d9 === "clone_follow"
  ) {
    if (v_6e0fd3 > 0) {
      const v_11083e =
        v_3b27d9 === "clone_like"
          ? "likes"
          : v_3b27d9 === "clone_comment"
            ? "comments"
            : v_3b27d9 === "clone_gift"
              ? "gifts"
              : "followers";
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: v_6e0fd3, openStatsTab: v_11083e },
        },
      });
      return;
    }
  }

  if (v_3b27d9 === "user_follow") {
    const v_f1620a = v_1ed7d9.getState().apiUser?.id;
    if (v_f1620a) {
      v_3c9f12.navigate("UserFollowList", { userId: v_f1620a, mode: "followers" });
      return;
    }
  }

  if (v_3b27d9 === "followee_new_clone" && v_6e0fd3 > 0) {
    v_3c9f12.navigate("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId: v_6e0fd3 } },
    });
    return;
  }

  if (v_3b27d9 === "intimacy_score" || /^afterlife:\/\/clone\/\d+\/intimacy/.test(v_f71b56)) {
    const v_062ae9 = v_6e0fd3 > 0 ? v_6e0fd3 : Number(v_f71b56.match(/clone\/(\d+)/)?.[1] ?? 0);
    if (v_062ae9 > 0) {
      v_3c9f12.navigate("Main", {
        screen: "ShortsTab",
        params: { openIntimacyCloneId: v_062ae9 },
      });
      return;
    }
  }

  if (v_3b27d9 === "moderation" || v_f71b56.startsWith("afterlife://reports")) {
    v_3c9f12.navigate("Main", {
      screen: "MyTab",
      params: { screen: "Reports", params: { tab: "received" } },
    });
    return;
  }

  const v_1e1c4f = v_f71b56.match(/^afterlife:\/\/invite\/(.+)$/);
  if (v_1e1c4f) {
    v_3c9f12.navigate("InviteAccept", { token: decodeURIComponent(v_1e1c4f[1]!) });
    return;
  }
  if (v_3b27d9 === "invite_received" && typeof v_9390e8.token === "string") {
    v_3c9f12.navigate("InviteAccept", { token: v_9390e8.token });
    return;
  }

  const v_3e6bf6 = v_f71b56.match(/^afterlife:\/\/oth-path\/(\d+)/);
  if (v_3e6bf6) {
    v_3c9f12.navigate("UserProfile", { userId: Number(v_3e6bf6[1]) });
    return;
  }
  if (v_baf950 > 0) {
    v_3c9f12.navigate("UserProfile", { userId: v_baf950 });
    return;
  }

  const v_3e1594 = v_f71b56.match(/^afterlife:\/\/clone\/(\d+)/);
  const v_03879f = v_3e1594 ? Number(v_3e1594[1]) : v_6e0fd3;
  if (v_03879f > 0) {
    v_3c9f12.navigate("Main", {
      screen: "ClonesTab",
      params: { screen: "CloneDetail", params: { cloneId: v_03879f } },
    });
  }
}
