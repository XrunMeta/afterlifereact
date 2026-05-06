import { v_a7c0d4 } from "vukrcww";
import { v_694b7f } from "../api/source";
import type { v_4b85a1, v_bc3df4 } from "../types/domain";
import { v_1ed7d9 } from "./authStore";
import {
  v_f5cc38,
  v_de2a30,
  v_11c954,
  v_b14fce,
  v_0ff331,
  type v_4c75cf,
} from "../api/clones";

const v_b9d568 = 1;

interface FeedState {

  feeds: v_bc3df4[];

  apiFeeds: v_4c75cf[] | null;
  apiLoading: boolean;
  likedIds: number[];
  bookmarkedIds: number[];
  selectedInterests: string[];
  toggleLike: (id: number) => void;
  toggleBookmark: (id: number) => void;
  setSelectedInterests: (interests: string[]) => void;
  getVisibleFeeds: () => v_bc3df4[];
  getFilteredFeeds: () => v_bc3df4[];
  loadDiscover: () => Promise<void>;
}

function v_5b0abe(c: v_4b85a1, v_493eec): boolean {
  if (v_3f4e2e.visibility === "public") return true;
  if (v_3f4e2e.ownerId === v_493eec) return true;
  const v_306056 = v_694b7f.coowners().some(
    (v_c4a45b) =>
      v_c4a45b.cloneId === v_3f4e2e.id &&
      v_c4a45b.userId === v_493eec &&
      v_c4a45b.status === "approved",
  );
  if (v_306056) return true;
  if (v_3f4e2e.visibility === "followers") {
    return v_694b7f.follows().some(
      (v_8b5cd8) =>
        v_8b5cd8.followerUserId === v_493eec && v_8b5cd8.followingCloneId === v_3f4e2e.id,
    );
  }
  return false;
}

export const v_0b62e7 = new Map<number, v_4b85a1>();

export const v_10e36e = new Map<number, { commentsCount: number }>();

function v_0a5d7b(item: v_4c75cf): v_bc3df4 {
  v_0b62e7.set(v_8c0b26.cloneId, {
    id: v_8c0b26.clone.id,
    cloneType: v_8c0b26.clone.cloneType,
    ownerId: -1, 
    displayName: v_8c0b26.clone.name,
    description: "",
    interests: v_8c0b26.interests,
    imageUrl: v_8c0b26.clone.avatarUrl ?? undefined,
    visibility: "public",
    status: "active",
    createdAt: v_8c0b26.createdAt,
  });
  v_10e36e.set(v_8c0b26.id, {
    commentsCount: v_8c0b26.commentsCount ?? 0,
  });
  return {
    id: v_8c0b26.id,
    cloneId: v_8c0b26.cloneId,
    content: v_8c0b26.content ?? "",
    mediaUrl: v_8c0b26.mediaUrl ?? undefined,
    mediaType: (v_8c0b26.mediaType as v_bc3df4["mediaType"]) ?? null,
    likesCount: v_8c0b26.likesCount,
    createdAt: v_8c0b26.createdAt,
  };
}

export const v_37977a = v_a7c0d4<FeedState>((v_bb8024, v_38715b) => ({
  feeds: v_694b7f.feeds(),
  apiFeeds: null,
  apiLoading: false,
  likedIds: [],
  bookmarkedIds: [],
  selectedInterests: [],

  toggleLike: (v_389afb) => {
    const v_b6e533 = v_38715b();
    const v_d50832 = v_b6e533.likedIds.includes(v_389afb);
    const v_d60f4b = !v_d50832;

    v_bb8024({
      likedIds: v_d60f4b
        ? [...v_b6e533.likedIds, v_389afb]
        : v_b6e533.likedIds.filter((v_ebec57) => v_ebec57 !== v_389afb),
    });

    const v_71b114 = v_b6e533.apiFeeds;
    if (v_71b114) {
      v_bb8024({
        apiFeeds: v_71b114.map((v_8b5cd8) =>
          v_8b5cd8.id === v_389afb
            ? { ...v_8b5cd8, likesCount: Math.max(0, v_8b5cd8.likesCount + (v_d60f4b ? 1 : -1)) }
            : v_8b5cd8,
        ),
      });
    }

    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) return;

    const v_5d003d = v_389afb < 0;
    const v_23cdc5 = v_5d003d ? -v_389afb : 0;
    const v_5ee69e = v_5d003d
      ? v_d60f4b
        ? v_b14fce(v_2ca7e0, v_23cdc5)
        : v_0ff331(v_2ca7e0, v_23cdc5)
      : v_d60f4b
        ? v_de2a30(v_2ca7e0, v_389afb)
        : v_11c954(v_2ca7e0, v_389afb);

    v_5ee69e
      .then((v_8f00b9) => {

        const v_c3bc75 = v_38715b().apiFeeds;
        if (v_c3bc75) {

          const v_3459a5 =
            v_5d003d &&
            "promoted" in v_8f00b9 &&
            (v_8f00b9 as { promoted?: boolean }).promoted &&
            "feedId" in v_8f00b9;
          const v_ceee18 = v_3459a5 ? (v_8f00b9 as { feedId: number }).feedId : v_389afb;
          v_bb8024({
            apiFeeds: v_c3bc75.map((v_8b5cd8) =>
              v_8b5cd8.id === v_389afb ? { ...v_8b5cd8, id: v_ceee18, likesCount: v_8f00b9.likesCount } : v_8b5cd8,
            ),
          });
          if (v_3459a5) {

            const v_132868 = v_38715b().likedIds;
            v_bb8024({
              likedIds: v_132868.includes(v_389afb)
                ? [...v_132868.filter((v_62c214) => v_62c214 !== v_389afb), v_ceee18]
                : v_132868,
            });
          }
        }
      })
      .catch((v_49263d) => {
        console.warn("[feedStore] toggleLike failed:", v_49263d);

        const v_c3bc75 = v_38715b();
        v_bb8024({
          likedIds: v_d50832
            ? [...v_c3bc75.likedIds.filter((v_ebec57) => v_ebec57 !== v_389afb), v_389afb]
            : v_c3bc75.likedIds.filter((v_ebec57) => v_ebec57 !== v_389afb),
        });
        if (v_c3bc75.apiFeeds) {
          v_bb8024({
            apiFeeds: v_c3bc75.apiFeeds.map((v_8b5cd8) =>
              v_8b5cd8.id === v_389afb
                ? { ...v_8b5cd8, likesCount: Math.max(0, v_8b5cd8.likesCount + (v_d60f4b ? -1 : 1)) }
                : v_8b5cd8,
            ),
          });
        }
      });
  },

  toggleBookmark: (v_389afb) =>
    v_bb8024((v_fd5f43) => ({
      bookmarkedIds: v_fd5f43.bookmarkedIds.includes(v_389afb)
        ? v_fd5f43.bookmarkedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_fd5f43.bookmarkedIds, v_389afb],
    })),

  setSelectedInterests: (v_774c91) => v_bb8024({ selectedInterests: v_774c91 }),

  loadDiscover: async () => {
    if (v_38715b().apiLoading) return;
    v_bb8024({ apiLoading: true });
    try {
      const v_2ca7e0 = v_1ed7d9.getState().accessToken ?? undefined;
      const v_8f00b9 = await v_f5cc38({ limit: 50, accessToken: v_2ca7e0 });
      console.log("[feedStore] discover loaded:", v_8f00b9.items.length);

      if (v_8f00b9.items.length === 0) {
        v_bb8024({ apiLoading: false });
        return;
      }

      const v_cc7245 = v_8f00b9.items
        .filter((v_23805a) => v_23805a.likedByMe === true)
        .map((v_23805a) => v_23805a.id);
      const v_c3bc75 = v_38715b().likedIds;
      const v_2b7a6d = Array.from(new Set([...v_c3bc75, ...v_cc7245]));
      v_bb8024({ apiFeeds: v_8f00b9.items, apiLoading: false, likedIds: v_2b7a6d });
    } catch (v_49263d) {
      console.warn("[feedStore] discover failed:", v_49263d);

      v_bb8024({ apiLoading: false });
    }
  },

  getVisibleFeeds: () => {

    const v_71b114 = v_38715b().apiFeeds;
    if (v_71b114) {
      return v_71b114.map(v_0a5d7b);
    }

    const v_ceb55a = v_1ed7d9.getState().user?.id ?? v_b9d568;
    const v_44e401 = new Set(
      v_694b7f.clones().filter((v_3f4e2e) => v_5b0abe(v_3f4e2e, v_ceb55a)).map((v_3f4e2e) => v_3f4e2e.id),
    );
    return v_38715b().feeds.filter((v_8b5cd8) => v_44e401.has(v_8b5cd8.cloneId));
  },

  getFilteredFeeds: () => {
    const { selectedInterests: v_976e06, apiFeeds: v_71b114 } = v_38715b();
    const v_cf55be = v_38715b().getVisibleFeeds();
    if (v_976e06.length === 0) return v_cf55be;
    if (v_71b114) {

      return v_cf55be.filter((v_8b5cd8) => {
        const v_3f4e2e = v_0b62e7.get(v_8b5cd8.cloneId);
        return v_3f4e2e ? v_3f4e2e.interests.some((v_ebec57) => v_976e06.includes(v_ebec57)) : false;
      });
    }
    const v_bafba0 = new Map(v_694b7f.clones().map((v_3f4e2e) => [v_3f4e2e.id, v_3f4e2e]));
    return v_cf55be.filter((v_8b5cd8) => {
      const v_3f4e2e = v_bafba0.get(v_8b5cd8.cloneId);
      return v_3f4e2e ? v_3f4e2e.interests.some((v_ebec57) => v_976e06.includes(v_ebec57)) : false;
    });
  },
}));
