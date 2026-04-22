import { v_a7c0d4 } from "vukrcww";
import { v_35d5ed } from "../mocks/seedIndex";
import type { v_4b85a1, v_bc3df4 } from "../types/domain";
import { v_1ed7d9 } from "./authStore";

const v_b9d568 = "user-001";

interface FeedState {
  feeds: v_bc3df4[];
  likedIds: string[];
  bookmarkedIds: string[];
  selectedInterests: string[];
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  setSelectedInterests: (interests: string[]) => void;
  getVisibleFeeds: () => v_bc3df4[];
  getFilteredFeeds: () => v_bc3df4[];
}

function v_5b0abe(c: v_4b85a1, v_493eec): boolean {
  if (v_3f4e2e.visibility === "public") return true;
  if (v_3f4e2e.ownerUserId === v_493eec) return true;
  const v_306056 = v_35d5ed.coowners.some(
    (v_c4a45b) =>
      v_c4a45b.cloneId === v_3f4e2e.id &&
      v_c4a45b.userId === v_493eec &&
      v_c4a45b.status === "approved",
  );
  if (v_306056) return true;
  if (v_3f4e2e.visibility === "followers") {
    return v_35d5ed.follows.some(
      (v_8b5cd8) =>
        v_8b5cd8.followerUserId === v_493eec && v_8b5cd8.followingCloneId === v_3f4e2e.id,
    );
  }
  return false;
}

export const v_37977a = v_a7c0d4<FeedState>((v_bb8024, v_38715b) => ({
  feeds: v_35d5ed.feeds,
  likedIds: [],
  bookmarkedIds: [],
  selectedInterests: [],

  toggleLike: (v_389afb) =>
    v_bb8024((v_fd5f43) => ({
      likedIds: v_fd5f43.likedIds.includes(v_389afb)
        ? v_fd5f43.likedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_fd5f43.likedIds, v_389afb],
    })),

  toggleBookmark: (v_389afb) =>
    v_bb8024((v_fd5f43) => ({
      bookmarkedIds: v_fd5f43.bookmarkedIds.includes(v_389afb)
        ? v_fd5f43.bookmarkedIds.filter((v_ebec57) => v_ebec57 !== v_389afb)
        : [...v_fd5f43.bookmarkedIds, v_389afb],
    })),

  setSelectedInterests: (v_774c91) => v_bb8024({ selectedInterests: v_774c91 }),

  getVisibleFeeds: () => {
    const v_ceb55a = v_1ed7d9.getState().user?.id ?? v_b9d568;
    const v_44e401 = new Set(
      v_35d5ed.clones.filter((v_3f4e2e) => v_5b0abe(v_3f4e2e, v_ceb55a)).map((v_3f4e2e) => v_3f4e2e.id),
    );
    return v_38715b().feeds.filter((v_8b5cd8) => v_44e401.has(v_8b5cd8.cloneId));
  },

  getFilteredFeeds: () => {
    const { selectedInterests: v_976e06 } = v_38715b();
    const v_cf55be = v_38715b().getVisibleFeeds();
    if (v_976e06.length === 0) return v_cf55be;
    const v_bafba0 = new Map(v_35d5ed.clones.map((v_3f4e2e) => [v_3f4e2e.id, v_3f4e2e]));
    return v_cf55be.filter((v_8b5cd8) => {
      const v_3f4e2e = v_bafba0.get(v_8b5cd8.cloneId);
      return v_3f4e2e ? v_3f4e2e.interests.some((v_ebec57) => v_976e06.includes(v_ebec57)) : false;
    });
  },
}));
