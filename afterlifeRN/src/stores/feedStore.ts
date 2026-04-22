import { create } from "zustand";
import { SEED } from "../mocks/seedIndex";
import type { DomainClone, DomainFeed } from "../types/domain";
import { useAuthStore } from "./authStore";

const DEFAULT_USER_ID = "user-001";

interface FeedState {
  feeds: DomainFeed[];
  likedIds: string[];
  bookmarkedIds: string[];
  selectedInterests: string[];
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  setSelectedInterests: (interests: string[]) => void;
  getVisibleFeeds: () => DomainFeed[];
  getFilteredFeeds: () => DomainFeed[];
}

function canSeeClone(c: DomainClone, currentUserId: string): boolean {
  if (c.visibility === "public") return true;
  if (c.ownerUserId === currentUserId) return true;
  const coowned = SEED.coowners.some(
    (co) =>
      co.cloneId === c.id &&
      co.userId === currentUserId &&
      co.status === "approved",
  );
  if (coowned) return true;
  if (c.visibility === "followers") {
    return SEED.follows.some(
      (f) =>
        f.followerUserId === currentUserId && f.followingCloneId === c.id,
    );
  }
  return false;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: SEED.feeds,
  likedIds: [],
  bookmarkedIds: [],
  selectedInterests: [],

  toggleLike: (id) =>
    set((s) => ({
      likedIds: s.likedIds.includes(id)
        ? s.likedIds.filter((i) => i !== id)
        : [...s.likedIds, id],
    })),

  toggleBookmark: (id) =>
    set((s) => ({
      bookmarkedIds: s.bookmarkedIds.includes(id)
        ? s.bookmarkedIds.filter((i) => i !== id)
        : [...s.bookmarkedIds, id],
    })),

  setSelectedInterests: (interests) => set({ selectedInterests: interests }),

  getVisibleFeeds: () => {
    const u = useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
    const visibleCloneIds = new Set(
      SEED.clones.filter((c) => canSeeClone(c, u)).map((c) => c.id),
    );
    return get().feeds.filter((f) => visibleCloneIds.has(f.cloneId));
  },

  getFilteredFeeds: () => {
    const { selectedInterests } = get();
    const visible = get().getVisibleFeeds();
    if (selectedInterests.length === 0) return visible;
    const cloneById = new Map(SEED.clones.map((c) => [c.id, c]));
    return visible.filter((f) => {
      const c = cloneById.get(f.cloneId);
      return c ? c.interests.some((i) => selectedInterests.includes(i)) : false;
    });
  },
}));
