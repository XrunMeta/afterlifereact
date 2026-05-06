import { v_a7c0d4 } from "vukrcww";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_694b7f } from "../api/source";
import type { v_7a4d15 } from "../types/domain";
import { v_1ed7d9 } from "./authStore";
import { v_cc9198 } from "../config/apiBase";

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

    const v_479f05 = await v_e84827.getItem(v_b6c376);
    const v_11ea7b = v_479f05 ? JSON.parse(v_479f05) : [];
    v_11ea7b.push({
      cloneId: v_6e0fd3,
      action: v_c3c3b0 ? "unfollow" : "follow",
      at: new Date().toISOString(),
    });
    await v_e84827.setItem(v_b6c376, JSON.stringify(v_11ea7b));

    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) return;
    try {
      const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_6e0fd3}/follow`, {
        method: v_c3c3b0 ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${v_2ca7e0}` },
      });
      if (!v_8f00b9.ok) {
        console.warn("[followStore] API toggle failed:", v_8f00b9.status);
      }
    } catch (v_49263d) {
      console.warn("[followStore] API toggle error:", v_49263d);
    }
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
