import { create } from "zustand";
import { seedSource } from "../api/source";
import type { DomainClone, DomainFeed } from "../types/domain";
import { useAuthStore } from "./authStore";
import {
  listDiscoverFeeds,
  likeFeed,
  unlikeFeed,
  type DiscoverFeedItem,
} from "../api/clones";

const DEFAULT_USER_ID = 1;

interface FeedState {

  feeds: DomainFeed[];

  apiFeeds: DiscoverFeedItem[] | null;
  apiLoading: boolean;
  likedIds: number[];
  bookmarkedIds: number[];
  selectedInterests: string[];
  toggleLike: (id: number) => void;
  toggleBookmark: (id: number) => void;
  setSelectedInterests: (interests: string[]) => void;
  getVisibleFeeds: () => DomainFeed[];
  getFilteredFeeds: () => DomainFeed[];
  loadDiscover: () => Promise<void>;
}

function canSeeClone(c: DomainClone, currentUserId: number): boolean {
  if (c.visibility === "public") return true;
  if (c.ownerId === currentUserId) return true;
  const coowned = seedSource.coowners().some(
    (co) =>
      co.cloneId === c.id &&
      co.userId === currentUserId &&
      co.status === "approved",
  );
  if (coowned) return true;
  if (c.visibility === "followers") {
    return seedSource.follows().some(
      (f) =>
        f.followerUserId === currentUserId && f.followingCloneId === c.id,
    );
  }
  return false;
}

export const apiCloneCache = new Map<number, DomainClone>();

function toDomainFeed(item: DiscoverFeedItem): DomainFeed {
  apiCloneCache.set(item.cloneId, {
    id: item.clone.id,
    cloneType: item.clone.cloneType,
    ownerId: -1, 
    displayName: item.clone.name,
    description: "",
    interests: item.interests,
    imageUrl: item.clone.avatarUrl ?? undefined,
    visibility: "public",
    status: "active",
    createdAt: item.createdAt,
  });
  return {
    id: item.id,
    cloneId: item.cloneId,
    content: item.content ?? "",
    mediaUrl: item.mediaUrl ?? undefined,
    mediaType: (item.mediaType as DomainFeed["mediaType"]) ?? null,
    likesCount: item.likesCount,
    createdAt: item.createdAt,
  };
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: seedSource.feeds(),
  apiFeeds: null,
  apiLoading: false,
  likedIds: [],
  bookmarkedIds: [],
  selectedInterests: [],

  toggleLike: (id) => {
    const state = get();
    const wasLiked = state.likedIds.includes(id);
    const willLike = !wasLiked;

    set({
      likedIds: willLike
        ? [...state.likedIds, id]
        : state.likedIds.filter((i) => i !== id),
    });

    const apiFeeds = state.apiFeeds;
    if (apiFeeds) {
      set({
        apiFeeds: apiFeeds.map((f) =>
          f.id === id
            ? { ...f, likesCount: Math.max(0, f.likesCount + (willLike ? 1 : -1)) }
            : f,
        ),
      });
    }

    if (id < 0) return;
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;
    const op = willLike ? likeFeed : unlikeFeed;
    op(accessToken, id)
      .then((res) => {

        const cur = get().apiFeeds;
        if (cur) {
          set({
            apiFeeds: cur.map((f) =>
              f.id === id ? { ...f, likesCount: res.likesCount } : f,
            ),
          });
        }
      })
      .catch((err) => {
        console.warn("[feedStore] toggleLike failed:", err);

        const cur = get();
        set({
          likedIds: wasLiked
            ? [...cur.likedIds.filter((i) => i !== id), id]
            : cur.likedIds.filter((i) => i !== id),
        });
        if (cur.apiFeeds) {
          set({
            apiFeeds: cur.apiFeeds.map((f) =>
              f.id === id
                ? { ...f, likesCount: Math.max(0, f.likesCount + (willLike ? -1 : 1)) }
                : f,
            ),
          });
        }
      });
  },

  toggleBookmark: (id) =>
    set((s) => ({
      bookmarkedIds: s.bookmarkedIds.includes(id)
        ? s.bookmarkedIds.filter((i) => i !== id)
        : [...s.bookmarkedIds, id],
    })),

  setSelectedInterests: (interests) => set({ selectedInterests: interests }),

  loadDiscover: async () => {
    if (get().apiLoading) return;
    set({ apiLoading: true });
    try {
      const res = await listDiscoverFeeds({ limit: 50 });
      console.log("[feedStore] discover loaded:", res.items.length);

      if (res.items.length === 0) {
        set({ apiLoading: false });
        return;
      }
      set({ apiFeeds: res.items, apiLoading: false });
    } catch (err) {
      console.warn("[feedStore] discover failed:", err);

      set({ apiLoading: false });
    }
  },

  getVisibleFeeds: () => {

    const apiFeeds = get().apiFeeds;
    if (apiFeeds) {
      return apiFeeds.map(toDomainFeed);
    }

    const u = useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
    const visibleCloneIds = new Set(
      seedSource.clones().filter((c) => canSeeClone(c, u)).map((c) => c.id),
    );
    return get().feeds.filter((f) => visibleCloneIds.has(f.cloneId));
  },

  getFilteredFeeds: () => {
    const { selectedInterests, apiFeeds } = get();
    const visible = get().getVisibleFeeds();
    if (selectedInterests.length === 0) return visible;
    if (apiFeeds) {

      return visible.filter((f) => {
        const c = apiCloneCache.get(f.cloneId);
        return c ? c.interests.some((i) => selectedInterests.includes(i)) : false;
      });
    }
    const cloneById = new Map(seedSource.clones().map((c) => [c.id, c]));
    return visible.filter((f) => {
      const c = cloneById.get(f.cloneId);
      return c ? c.interests.some((i) => selectedInterests.includes(i)) : false;
    });
  },
}));
