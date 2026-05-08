import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { seedSource } from "../api/source";
import type { DomainFollow } from "../types/domain";
import { useAuthStore } from "./authStore";
import { API_BASE } from "../config/apiBase";

const STORAGE_KEY = "@afterlifeRN/follow/overrides";
const DEFAULT_USER_ID = 1;
const LOCAL_FOLLOW_ID_BASE = 1_000_000_000;

interface Override {
  cloneId: number;
  action: "follow" | "unfollow";
  at: string;
}

interface FollowState {
  follows: DomainFollow[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFollowing: (cloneId: number) => boolean;
  toggleFollow: (cloneId: number) => Promise<void>;

  unfollowLocalForBlock: (cloneId: number) => Promise<void>;
  followersCount: (cloneId: number) => number;
  followingIdsFor: (userId: number) => number[];
  resetForLogout: () => Promise<void>;
}

let counter = 0;
const newFollowId = () => LOCAL_FOLLOW_ID_BASE + ++counter;

export const useFollowStore = create<FollowState>((set, get) => ({
  follows: [],
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const overrides: Override[] = raw ? JSON.parse(raw) : [];
    let follows = [...seedSource.follows()];
    const currentUserId =
      useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
    overrides.forEach((o) => {
      if (o.action === "follow") {
        const already = follows.some(
          (f) =>
            f.followerUserId === currentUserId &&
            f.followingCloneId === o.cloneId,
        );
        if (!already) {
          follows.push({
            id: newFollowId(),
            followerUserId: currentUserId,
            followingCloneId: o.cloneId,
            followedAt: o.at,
          });
        }
      } else {
        follows = follows.filter(
          (f) =>
            !(
              f.followerUserId === currentUserId &&
              f.followingCloneId === o.cloneId
            ),
        );
      }
    });
    set({ follows, hydrated: true });
  },

  isFollowing: (cloneId) => {
    const u = useAuthStore.getState().user?.id;
    return get().follows.some(
      (f) => f.followerUserId === u && f.followingCloneId === cloneId,
    );
  },

  toggleFollow: async (cloneId) => {
    const u = useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
    const exists = get().follows.some(
      (f) => f.followerUserId === u && f.followingCloneId === cloneId,
    );
    const action = exists ? "unfollow" : "follow";
    console.log(
      `[FOLLOW][${action}] cloneId=${cloneId} userId=${u} startedAt=${new Date().toISOString()} prevFollowsCount=${get().follows.length}`,
    );

    if (exists) {
      set({
        follows: get().follows.filter(
          (f) =>
            !(f.followerUserId === u && f.followingCloneId === cloneId),
        ),
      });
    } else {
      set({
        follows: [
          ...get().follows,
          {
            id: newFollowId(),
            followerUserId: u,
            followingCloneId: cloneId,
            followedAt: new Date().toISOString(),
          },
        ],
      });
    }
    console.log(
      `[FOLLOW][${action}] local optimistic done — newFollowsCount=${get().follows.length}`,
    );

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const overrides: Override[] = raw ? JSON.parse(raw) : [];
    overrides.push({
      cloneId,
      action,
      at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    console.log(
      `[FOLLOW][${action}] AsyncStorage override saved — totalOverrides=${overrides.length}`,
    );

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      console.log(`[FOLLOW][${action}] no accessToken — skip API call`);
      return;
    }
    const url = `${API_BASE}/oth-path${cloneId}/follow`;
    const method = exists ? "DELETE" : "POST";
    console.log(`[FOLLOW][${action}] → ${method} ${url}`);
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log(
        `[FOLLOW][${action}] ← ${res.status} ${res.ok ? "ok" : "FAIL"}`,
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[FOLLOW][${action}] API toggle failed:`, res.status, text);
      }
    } catch (err) {
      console.warn(`[FOLLOW][${action}] API toggle error:`, err);
    }
  },

  unfollowLocalForBlock: async (cloneId) => {
    const u = useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
    const before = get().follows.length;
    const wasFollowing = get().follows.some(
      (f) => f.followerUserId === u && f.followingCloneId === cloneId,
    );
    console.log(
      `[FOLLOW][block-unfollow] cloneId=${cloneId} userId=${u} wasFollowing=${wasFollowing} prevFollowsCount=${before}`,
    );
    set({
      follows: get().follows.filter(
        (f) => !(f.followerUserId === u && f.followingCloneId === cloneId),
      ),
    });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const overrides: Override[] = raw ? JSON.parse(raw) : [];
    overrides.push({
      cloneId,
      action: "unfollow",
      at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    console.log(
      `[FOLLOW][block-unfollow] done — newFollowsCount=${get().follows.length} totalOverrides=${overrides.length}`,
    );
  },

  followersCount: (cloneId) =>
    get().follows.filter((f) => f.followingCloneId === cloneId).length,

  followingIdsFor: (userId) =>
    get()
      .follows.filter((f) => f.followerUserId === userId)
      .map((f) => f.followingCloneId),

  resetForLogout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ follows: [], hydrated: false });
  },
}));
