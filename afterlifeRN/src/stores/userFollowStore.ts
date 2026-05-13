

import { v_a7c0d4 } from "vukrcww";
import { v_1ed7d9 } from "./authStore";
import {
  v_31c237,
  v_deb9b0,
  v_5959d8,
} from "../api/users";

interface UserFollowState {

  followingIds: Set<number>;
  hydrated: boolean;
  hydrating: boolean;

  hydrate: () => Promise<void>;
  isFollowing: (userId: number) => boolean;

  toggleFollow: (userId: number) => Promise<boolean>;

  setFollowing: (userId: number, value: boolean) => void;
  resetForLogout: () => void;
}

export const v_98d20a = v_a7c0d4<UserFollowState>((v_bb8024, v_38715b) => ({
  followingIds: new Set(),
  hydrated: false,
  hydrating: false,

  hydrate: async () => {
    if (v_38715b().hydrated || v_38715b().hydrating) return;
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    const v_b32680 = v_1ed7d9.getState().apiUser?.id ?? v_1ed7d9.getState().user?.id;
    if (!v_2ca7e0 || !v_b32680) {

      return;
    }
    v_bb8024({ hydrating: true });
    try {
      const v_8f00b9 = await v_5959d8(v_2ca7e0, v_b32680, 200);
      const v_a448ad = new Set<number>(v_8f00b9.items.map((v_23805a) => v_23805a.userId));
      v_bb8024({ followingIds: v_a448ad, hydrated: true, hydrating: false });
    } catch (v_49263d) {
      console.warn("[userFollowStore] hydrate failed:", v_49263d);
      v_bb8024({ hydrating: false });
    }
  },

  isFollowing: (v_43e90c) => v_38715b().followingIds.has(v_43e90c),

  setFollowing: (v_43e90c, v_3b402b) => {
    const v_a448ad = new Set(v_38715b().followingIds);
    if (v_3b402b) v_a448ad.add(v_43e90c);
    else v_a448ad.delete(v_43e90c);
    v_bb8024({ followingIds: v_a448ad });
  },

  toggleFollow: async (v_43e90c) => {
    const v_c3c3b0 = v_38715b().followingIds.has(v_43e90c);

    const v_a448ad = new Set(v_38715b().followingIds);
    if (v_c3c3b0) v_a448ad.delete(v_43e90c);
    else v_a448ad.add(v_43e90c);
    v_bb8024({ followingIds: v_a448ad });

    const v_68f0aa = v_1ed7d9.getState();
    const v_c3bc75 = v_68f0aa.apiUser;
    if (v_c3bc75) {
      const v_e9396c = v_c3c3b0 ? -1 : 1;
      const v_c97dd8 = Math.max(0, (v_c3bc75.followingCount ?? 0) + v_e9396c);
      v_68f0aa.patchApiUser({ followingCount: v_c97dd8 });
    }

    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) {
      console.warn("[userFollowStore] toggleFollow: no accessToken");
      return !v_c3c3b0;
    }
    try {
      if (v_c3c3b0) {
        await v_deb9b0(v_2ca7e0, v_43e90c);
      } else {
        await v_31c237(v_2ca7e0, v_43e90c);
      }
      return !v_c3c3b0;
    } catch (v_49263d) {

      const v_86fa3e = new Set(v_38715b().followingIds);
      if (v_c3c3b0) v_86fa3e.add(v_43e90c);
      else v_86fa3e.delete(v_43e90c);
      v_bb8024({ followingIds: v_86fa3e });
      const v_91a6b7 = v_1ed7d9.getState().apiUser;
      if (v_91a6b7) {
        const v_e9396c = v_c3c3b0 ? 1 : -1;
        const v_c97dd8 = Math.max(0, (v_91a6b7.followingCount ?? 0) + v_e9396c);
        v_1ed7d9.getState().patchApiUser({ followingCount: v_c97dd8 });
      }
      console.warn("[userFollowStore] toggleFollow API failed:", v_49263d);
      throw v_49263d;
    }
  },

  resetForLogout: () => {
    v_bb8024({ followingIds: new Set(), hydrated: false, hydrating: false });
  },
}));
