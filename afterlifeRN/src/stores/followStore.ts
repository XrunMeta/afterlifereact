import { v_a7c0d4 } from "vukrcww";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_694b7f } from "../api/source";
import type { v_7a4d15 } from "../types/domain";
import { v_1ed7d9 } from "./authStore";
import { v_cc9198 } from "../config/apiBase";
import { v_84a859 } from "../api/auth";
import { v_3be591 } from "../lib/errorI18n";
import { v_650589, v_bec54f } from "../lib/penaltyNotice";

const v_b6c376 = "@afterlifeRN/follow/overrides";
const v_b9d568 = 1;
const v_980853 = 1_000_000_000;

interface Override {
  cloneId: number;
  action: "follow" | "unfollow";
  at: string;
}

interface FollowState {
  follows: v_7a4d15[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFollowing: (cloneId: number) => boolean;
  toggleFollow: (cloneId: number) => Promise<void>;

  unfollowLocalForBlock: (cloneId: number) => Promise<void>;
  followersCount: (cloneId: number) => number;
  followingIdsFor: (userId: number) => number[];
  resetForLogout: () => Promise<void>;
}

let v_054741 = 0;
const v_ac1f9e = () => v_980853 + ++v_054741;

export const v_b4902e = v_a7c0d4<FollowState>((v_bb8024, v_38715b) => ({
  follows: [],
  hydrated: false,

  hydrate: async () => {
    const v_479f05 = await v_e84827.getItem(v_b6c376);
    const v_11ea7b = v_479f05 ? JSON.parse(v_479f05) : [];
    let v_1e752a = [...v_694b7f.follows()];
    const v_493eec =
      v_1ed7d9.getState().user?.id ?? v_b9d568;
    v_11ea7b.forEach((v_b6c474) => {
      if (v_b6c474.action === "follow") {
        const v_5b4e12 = v_1e752a.some(
          (v_8b5cd8) =>
            v_8b5cd8.followerUserId === v_493eec &&
            v_8b5cd8.followingCloneId === v_b6c474.cloneId,
        );
        if (!v_5b4e12) {
          v_1e752a.push({
            id: v_ac1f9e(),
            followerUserId: v_493eec,
            followingCloneId: v_b6c474.cloneId,
            followedAt: v_b6c474.at,
          });
        }
      } else {
        v_1e752a = v_1e752a.filter(
          (v_8b5cd8) =>
            !(
              v_8b5cd8.followerUserId === v_493eec &&
              v_8b5cd8.followingCloneId === v_b6c474.cloneId
            ),
        );
      }
    });
    v_bb8024({ follows: v_1e752a, hydrated: true });
  },

  isFollowing: (v_6e0fd3) => {
    const v_ceb55a = v_1ed7d9.getState().user?.id;
    return v_38715b().follows.some(
      (v_8b5cd8) => v_8b5cd8.followerUserId === v_ceb55a && v_8b5cd8.followingCloneId === v_6e0fd3,
    );
  },

  toggleFollow: async (v_6e0fd3) => {
    const v_ceb55a = v_1ed7d9.getState().user?.id ?? v_b9d568;
    const v_c3c3b0 = v_38715b().follows.some(
      (v_8b5cd8) => v_8b5cd8.followerUserId === v_ceb55a && v_8b5cd8.followingCloneId === v_6e0fd3,
    );
    const v_9b064f = v_c3c3b0 ? "unfollow" : "follow";
    const v_29392d = v_38715b().follows; 
    console.log(
      `[FOLLOW][${v_9b064f}] cloneId=${v_6e0fd3} userId=${v_ceb55a} startedAt=${new Date().toISOString()} prevFollowsCount=${v_38715b().follows.length}`,
    );

    if (v_c3c3b0) {
      v_bb8024({
        follows: v_38715b().follows.filter(
          (v_8b5cd8) =>
            !(v_8b5cd8.followerUserId === v_ceb55a && v_8b5cd8.followingCloneId === v_6e0fd3),
        ),
      });
    } else {
      v_bb8024({
        follows: [
          ...v_38715b().follows,
          {
            id: v_ac1f9e(),
            followerUserId: v_ceb55a,
            followingCloneId: v_6e0fd3,
            followedAt: new Date().toISOString(),
          },
        ],
      });
    }
    console.log(
      `[FOLLOW][${v_9b064f}] local optimistic done — newFollowsCount=${v_38715b().follows.length}`,
    );

    const v_479f05 = await v_e84827.getItem(v_b6c376);
    const v_11ea7b = v_479f05 ? JSON.parse(v_479f05) : [];
    v_11ea7b.push({
      cloneId: v_6e0fd3,
      action: v_9b064f,
      at: new Date().toISOString(),
    });
    await v_e84827.setItem(v_b6c376, JSON.stringify(v_11ea7b));
    console.log(
      `[FOLLOW][${v_9b064f}] AsyncStorage override saved — totalOverrides=${v_11ea7b.length}`,
    );

    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) {
      console.log(`[FOLLOW][${v_9b064f}] no accessToken — skip API call`);
      return;
    }
    const v_f71b56 = `${v_cc9198}/oth-path${v_6e0fd3}/follow`;
    const v_bfe9b9 = v_c3c3b0 ? "DELETE" : "POST";
    console.log(`[FOLLOW][${v_9b064f}] → ${v_bfe9b9} ${v_f71b56}`);
    try {
      const v_8f00b9 = await fetch(v_f71b56, {
        method: v_bfe9b9,
        headers: { Authorization: `Bearer ${v_2ca7e0}` },
      });
      console.log(
        `[FOLLOW][${v_9b064f}] ← ${v_8f00b9.status} ${v_8f00b9.ok ? "ok" : "FAIL"}`,
      );
      if (!v_8f00b9.ok) {
        const v_9b6134 = await v_8f00b9.text().catch(() => "");
        console.warn(`[FOLLOW][${v_9b064f}] API toggle failed:`, v_8f00b9.status, v_9b6134);

        let v_c99bd2 = "";
        let v_a8cd21 = "";
        try {
          const v_b75e36 = JSON.parse(v_9b6134) as { error?: { code?: string; message?: string } };
          v_c99bd2 = v_b75e36.error?.code ?? "";
          v_a8cd21 = v_b75e36.error?.message ?? "";
        } catch {

        }
        if (v_bec54f.has(v_c99bd2)) {
          v_bb8024({ follows: v_29392d });
          const v_c3bc75 = await v_e84827.getItem(v_b6c376);
          const v_ef8ab1 = v_c3bc75 ? JSON.parse(v_c3bc75) : [];
          const v_e86ad8 = v_ef8ab1.map((v_b6c474) => v_b6c474.cloneId === v_6e0fd3 && v_b6c474.action === v_9b064f).lastIndexOf(true);
          if (v_e86ad8 >= 0) {
            v_ef8ab1.splice(v_e86ad8, 1);
            await v_e84827.setItem(v_b6c376, JSON.stringify(v_ef8ab1));
          }
          v_650589(new v_84a859(v_8f00b9.status, v_c99bd2, v_3be591(v_c99bd2, v_a8cd21)));
        }
      }
    } catch (v_49263d) {
      console.warn(`[FOLLOW][${v_9b064f}] API toggle error:`, v_49263d);
    }
  },

  unfollowLocalForBlock: async (v_6e0fd3) => {
    const v_ceb55a = v_1ed7d9.getState().user?.id ?? v_b9d568;
    const v_e98932 = v_38715b().follows.length;
    const v_fecfe3 = v_38715b().follows.some(
      (v_8b5cd8) => v_8b5cd8.followerUserId === v_ceb55a && v_8b5cd8.followingCloneId === v_6e0fd3,
    );
    console.log(
      `[FOLLOW][block-unfollow] cloneId=${v_6e0fd3} userId=${v_ceb55a} wasFollowing=${v_fecfe3} prevFollowsCount=${v_e98932}`,
    );
    v_bb8024({
      follows: v_38715b().follows.filter(
        (v_8b5cd8) => !(v_8b5cd8.followerUserId === v_ceb55a && v_8b5cd8.followingCloneId === v_6e0fd3),
      ),
    });

    const v_479f05 = await v_e84827.getItem(v_b6c376);
    const v_11ea7b = v_479f05 ? JSON.parse(v_479f05) : [];
    v_11ea7b.push({
      cloneId: v_6e0fd3,
      action: "unfollow",
      at: new Date().toISOString(),
    });
    await v_e84827.setItem(v_b6c376, JSON.stringify(v_11ea7b));
    console.log(
      `[FOLLOW][block-unfollow] done — newFollowsCount=${v_38715b().follows.length} totalOverrides=${v_11ea7b.length}`,
    );
  },

  followersCount: (v_6e0fd3) =>
    v_38715b().follows.filter((v_8b5cd8) => v_8b5cd8.followingCloneId === v_6e0fd3).length,

  followingIdsFor: (v_43e90c) =>
    v_38715b()
      .follows.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_43e90c)
      .map((v_8b5cd8) => v_8b5cd8.followingCloneId),

  resetForLogout: async () => {
    await v_e84827.removeItem(v_b6c376);
    v_bb8024({ follows: [], hydrated: false });
  },
}));
