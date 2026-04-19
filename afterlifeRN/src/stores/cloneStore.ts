import { v_a7c0d4 } from "vukrcww";
import type { v_affcc0, v_c2a674 } from "../types/clone";
import { v_2d6fda, v_fe6cdd } from "../api";
import {
  v_128f06,
  v_47f798,
} from "../api/mappers/clone";
import { v_1ed7d9 } from "./authStore";

interface CloneState {
  myClones: v_affcc0[];
  publicClones: v_affcc0[];
  currentClone: v_affcc0 | null;
  creationDraft: v_c2a674;
  loadingMine: boolean;
  loadingPublic: boolean;
  loadingDetail: boolean;
  error: string | null;

  setCurrentClone: (clone: v_affcc0 | null) => void;
  setCreationDraft: (data: Partial<v_c2a674>) => void;
  resetCreationDraft: () => void;
  getCloneById: (id: string) => v_affcc0 | undefined;

  loadMyClones: () => Promise<void>;
  loadPublicClones: (q?: string) => Promise<void>;
  loadCloneDetail: (id: string) => Promise<v_affcc0 | null>;
  updateClone: (
    id: string,
    body: { name?: string; description?: string; visibility?: "public" | "private" | "followers" },
  ) => Promise<void>;
  softDeleteClone: (id: string) => Promise<void>;
  followClone: (id: string) => Promise<void>;
  unfollowClone: (id: string) => Promise<void>;
}

function v_953d22(v_9e86fd): string {
  if (v_9e86fd instanceof v_fe6cdd) return v_9e86fd.message;
  if (v_9e86fd instanceof Error) return v_9e86fd.message;
  return "요청 실패";
}

export const v_194498 = v_a7c0d4<CloneState>((v_bb8024, v_38715b) => ({
  myClones: [],
  publicClones: [],
  currentClone: null,
  creationDraft: {},
  loadingMine: false,
  loadingPublic: false,
  loadingDetail: false,
  error: null,

  setCurrentClone: (v_eb25ce) => v_bb8024({ currentClone: v_eb25ce }),

  setCreationDraft: (v_9390e8) =>
    v_bb8024((v_b6e533) => ({ creationDraft: { ...v_b6e533.creationDraft, ...v_9390e8 } })),

  resetCreationDraft: () => v_bb8024({ creationDraft: {} }),

  getCloneById: (v_389afb) => {
    const { myClones: v_4cd149, publicClones: v_abb7a4, currentClone: v_77dfc1 } = v_38715b();
    if (v_77dfc1?.id === v_389afb) return v_77dfc1;
    return v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_389afb) ?? v_abb7a4.find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
  },

  loadMyClones: async () => {
    const v_43e90c = v_1ed7d9.getState().user?.id;
    if (!v_43e90c) {
      v_bb8024({ myClones: [], loadingMine: false });
      return;
    }
    v_bb8024({ loadingMine: true, error: null });
    try {
      const v_8f00b9 = await v_2d6fda.search({ ownerId: Number(v_43e90c), limit: 50 });
      v_bb8024({
        myClones: v_8f00b9.items.map(v_47f798),
        loadingMine: false,
      });
    } catch (v_9e86fd) {
      v_bb8024({ loadingMine: false, error: v_953d22(v_9e86fd) });
    }
  },

  loadPublicClones: async (v_ab6401) => {
    v_bb8024({ loadingPublic: true, error: null });
    try {
      const v_8f00b9 = await v_2d6fda.search({ q: v_ab6401, limit: 30 });
      v_bb8024({
        publicClones: v_8f00b9.items.map(v_47f798),
        loadingPublic: false,
      });
    } catch (v_9e86fd) {
      v_bb8024({ loadingPublic: false, error: v_953d22(v_9e86fd) });
    }
  },

  loadCloneDetail: async (v_389afb) => {
    v_bb8024({ loadingDetail: true, error: null });
    try {
      const v_3cfdfc = await v_2d6fda.get(Number(v_389afb));
      const v_89b3da = v_128f06(v_3cfdfc);
      v_bb8024({ currentClone: v_89b3da, loadingDetail: false });
      return v_89b3da;
    } catch (v_9e86fd) {
      v_bb8024({ loadingDetail: false, error: v_953d22(v_9e86fd) });
      return null;
    }
  },

  updateClone: async (v_389afb, v_4d33b2) => {
    try {
      const v_42de16 = await v_2d6fda.update(Number(v_389afb), v_4d33b2);
      const v_89b3da = v_128f06(v_42de16);
      v_bb8024((v_b6e533) => ({
        currentClone:
          v_b6e533.currentClone?.id === v_389afb ? v_89b3da : v_b6e533.currentClone,
        myClones: v_b6e533.myClones.map((v_3f4e2e) => (v_3f4e2e.id === v_389afb ? { ...v_3f4e2e, ...v_89b3da } : v_3f4e2e)),
      }));
    } catch (v_9e86fd) {
      v_bb8024({ error: v_953d22(v_9e86fd) });
      throw v_9e86fd;
    }
  },

  softDeleteClone: async (v_389afb) => {
    try {
      await v_2d6fda.softDelete(Number(v_389afb));
      v_bb8024((v_b6e533) => ({
        myClones: v_b6e533.myClones.filter((v_3f4e2e) => v_3f4e2e.id !== v_389afb),
        currentClone:
          v_b6e533.currentClone?.id === v_389afb ? null : v_b6e533.currentClone,
      }));
    } catch (v_9e86fd) {
      v_bb8024({ error: v_953d22(v_9e86fd) });
      throw v_9e86fd;
    }
  },

  followClone: async (v_389afb) => {
    try {
      await v_2d6fda.follow(Number(v_389afb));
    } catch (v_9e86fd) {
      v_bb8024({ error: v_953d22(v_9e86fd) });
      throw v_9e86fd;
    }
  },

  unfollowClone: async (v_389afb) => {
    try {
      await v_2d6fda.unfollow(Number(v_389afb));
    } catch (v_9e86fd) {
      v_bb8024({ error: v_953d22(v_9e86fd) });
      throw v_9e86fd;
    }
  },
}));
