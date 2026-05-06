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
  followersCount: (cloneId: number) => number;
  followingIdsFor: (userId: number) => number[];
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

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const overrides: Override[] = raw ? JSON.parse(raw) : [];
    overrides.push({
      cloneId,
      action: exists ? "unfollow" : "follow",
      at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/oth-path${cloneId}/follow`, {
        method: exists ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.warn("[followStore] API toggle failed:", res.status);
      }
    } catch (err) {
      console.warn("[followStore] API toggle error:", err);
    }
  },

  followersCount: (cloneId) =>
    get().follows.filter((f) => f.followingCloneId === cloneId).length,

  followingIdsFor: (userId) =>
    get()
      .follows.filter((f) => f.followerUserId === userId)
      .map((f) => f.followingCloneId),
}));
