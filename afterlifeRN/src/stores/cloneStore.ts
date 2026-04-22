import { create } from "zustand";
import type { Clone, CloneCreationDraft } from "../types/clone";
import { SEED } from "../mocks/seedIndex";

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
  getCloneById: (id: string) => Clone | undefined;
  addClone: (clone: Clone) => void;
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
    return SEED.clones.find((c) => c.id === id);
  },

  addClone: (clone) =>
    set((state) => ({
      localClones: [...state.localClones, clone],
    })),
}));
