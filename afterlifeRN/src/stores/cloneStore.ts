import { create } from "zustand";
import type { Clone, CloneCreationDraft } from "../types/clone";
import { clonesApi, ApiError } from "../api";
import {
  apiCloneDetailToClone,
  apiCloneSummaryToClone,
} from "../api/mappers/clone";
import { useAuthStore } from "./authStore";

interface CloneState {
  myClones: Clone[];
  publicClones: Clone[];
  currentClone: Clone | null;
  creationDraft: CloneCreationDraft;
  loadingMine: boolean;
  loadingPublic: boolean;
  loadingDetail: boolean;
  error: string | null;

  setCurrentClone: (clone: Clone | null) => void;
  setCreationDraft: (data: Partial<CloneCreationDraft>) => void;
  resetCreationDraft: () => void;
  getCloneById: (id: string) => Clone | undefined;

  loadMyClones: () => Promise<void>;
  loadPublicClones: (q?: string) => Promise<void>;
  loadCloneDetail: (id: string) => Promise<Clone | null>;
  updateClone: (
    id: string,
    body: { name?: string; description?: string; visibility?: "public" | "private" | "followers" },
  ) => Promise<void>;
  softDeleteClone: (id: string) => Promise<void>;
  followClone: (id: string) => Promise<void>;
  unfollowClone: (id: string) => Promise<void>;
}

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "요청 실패";
}

export const useCloneStore = create<CloneState>((set, get) => ({
  myClones: [],
  publicClones: [],
  currentClone: null,
  creationDraft: {},
  loadingMine: false,
  loadingPublic: false,
  loadingDetail: false,
  error: null,

  setCurrentClone: (clone) => set({ currentClone: clone }),

  setCreationDraft: (data) =>
    set((state) => ({ creationDraft: { ...state.creationDraft, ...data } })),

  resetCreationDraft: () => set({ creationDraft: {} }),

  getCloneById: (id) => {
    const { myClones, publicClones, currentClone } = get();
    if (currentClone?.id === id) return currentClone;
    return myClones.find((c) => c.id === id) ?? publicClones.find((c) => c.id === id);
  },

  loadMyClones: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ myClones: [], loadingMine: false });
      return;
    }
    set({ loadingMine: true, error: null });
    try {
      const res = await clonesApi.search({ ownerId: Number(userId), limit: 50 });
      set({
        myClones: res.items.map(apiCloneSummaryToClone),
        loadingMine: false,
      });
    } catch (e) {
      set({ loadingMine: false, error: errMsg(e) });
    }
  },

  loadPublicClones: async (q) => {
    set({ loadingPublic: true, error: null });
    try {
      const res = await clonesApi.search({ q, limit: 30 });
      set({
        publicClones: res.items.map(apiCloneSummaryToClone),
        loadingPublic: false,
      });
    } catch (e) {
      set({ loadingPublic: false, error: errMsg(e) });
    }
  },

  loadCloneDetail: async (id) => {
    set({ loadingDetail: true, error: null });
    try {
      const detail = await clonesApi.get(Number(id));
      const ui = apiCloneDetailToClone(detail);
      set({ currentClone: ui, loadingDetail: false });
      return ui;
    } catch (e) {
      set({ loadingDetail: false, error: errMsg(e) });
      return null;
    }
  },

  updateClone: async (id, body) => {
    try {
      const updated = await clonesApi.update(Number(id), body);
      const ui = apiCloneDetailToClone(updated);
      set((state) => ({
        currentClone:
          state.currentClone?.id === id ? ui : state.currentClone,
        myClones: state.myClones.map((c) => (c.id === id ? { ...c, ...ui } : c)),
      }));
    } catch (e) {
      set({ error: errMsg(e) });
      throw e;
    }
  },

  softDeleteClone: async (id) => {
    try {
      await clonesApi.softDelete(Number(id));
      set((state) => ({
        myClones: state.myClones.filter((c) => c.id !== id),
        currentClone:
          state.currentClone?.id === id ? null : state.currentClone,
      }));
    } catch (e) {
      set({ error: errMsg(e) });
      throw e;
    }
  },

  followClone: async (id) => {
    try {
      await clonesApi.follow(Number(id));
    } catch (e) {
      set({ error: errMsg(e) });
      throw e;
    }
  },

  unfollowClone: async (id) => {
    try {
      await clonesApi.unfollow(Number(id));
    } catch (e) {
      set({ error: errMsg(e) });
      throw e;
    }
  },
}));
