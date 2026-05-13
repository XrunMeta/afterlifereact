

import { create } from "zustand";
import { useAuthStore } from "./authStore";
import {
  followUser,
  unfollowUser,
  listUserFollowing,
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

export const useUserFollowStore = create<UserFollowState>((set, get) => ({
  followingIds: new Set(),
  hydrated: false,
  hydrating: false,

  hydrate: async () => {
    if (get().hydrated || get().hydrating) return;
    const accessToken = useAuthStore.getState().accessToken;
    const me = useAuthStore.getState().apiUser?.id ?? useAuthStore.getState().user?.id;
    if (!accessToken || !me) {

      return;
    }
    set({ hydrating: true });
    try {
      const res = await listUserFollowing(accessToken, me, 200);
      const next = new Set<number>(res.items.map((it) => it.userId));
      set({ followingIds: next, hydrated: true, hydrating: false });
    } catch (err) {
      console.warn("[userFollowStore] hydrate failed:", err);
      set({ hydrating: false });
    }
  },

  isFollowing: (userId) => get().followingIds.has(userId),

  setFollowing: (userId, value) => {
    const next = new Set(get().followingIds);
    if (value) next.add(userId);
    else next.delete(userId);
    set({ followingIds: next });
  },

  toggleFollow: async (userId) => {
    const exists = get().followingIds.has(userId);

    const next = new Set(get().followingIds);
    if (exists) next.delete(userId);
    else next.add(userId);
    set({ followingIds: next });

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      console.warn("[userFollowStore] toggleFollow: no accessToken");
      return !exists;
    }
    try {
      if (exists) {
        await unfollowUser(accessToken, userId);
      } else {
        await followUser(accessToken, userId);
      }
      return !exists;
    } catch (err) {

      const rollback = new Set(get().followingIds);
      if (exists) rollback.add(userId);
      else rollback.delete(userId);
      set({ followingIds: rollback });
      console.warn("[userFollowStore] toggleFollow API failed:", err);
      throw err;
    }
  },

  resetForLogout: () => {
    set({ followingIds: new Set(), hydrated: false, hydrating: false });
  },
}));
