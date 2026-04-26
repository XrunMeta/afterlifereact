import { create } from "zustand";
import type { Clone, CloneCreationDraft } from "../types/clone";
import { seedSource } from "../api/source";

const INITIAL_DRAFT: CloneCreationDraft = {
  interests: [],
  coownerInvites: [],
};

interface CloneState {
  localClones: Clone[];
  currentClone: Clone | null;
  creationDraft: CloneCreationDraft;
  setCurrentClone: (clone: Clone | null) => void;
  setCreationDraft: (data: Partial<CloneCreationDraft>) => void;
  resetCreationDraft: () => void;
  getCloneById: (id: number) => Clone | undefined;
  addClone: (clone: Clone) => void;

  updateLocalClone: (id: number, patch: Partial<Clone>) => void;
}

export const useCloneStore = create<CloneState>((set, get) => ({
  localClones: [],
  currentClone: null,
  creationDraft: { ...INITIAL_DRAFT },

  setCurrentClone: (clone) => set({ currentClone: clone }),

  setCreationDraft: (data) =>
    set((state) => ({
      creationDraft: { ...state.creationDraft, ...data },
    })),

  resetCreationDraft: () => set({ creationDraft: { ...INITIAL_DRAFT } }),

  getCloneById: (id) => {
    const local = get().localClones.find((c) => c.id === id);
    if (local) return local;
    return seedSource.clones().find((c) => c.id === id);
  },

  addClone: (clone) =>
    set((state) => ({
      localClones: [...state.localClones, clone],
    })),

  updateLocalClone: (id, patch) => {
    const existing = get().localClones.find((c) => c.id === id);
    if (existing) {
      set((state) => ({
        localClones: state.localClones.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      return;
    }
    const seed = seedSource.clones().find((c) => c.id === id);
    if (seed) {
      set((state) => ({
        localClones: [...state.localClones, { ...seed, ...patch }],
      }));
    }
  },
}));
