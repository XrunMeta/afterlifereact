import { create } from "zustand";
import type { Clone, CloneCreationDraft } from "../types/clone";
import mockClones from "../mocks/clones.json";

const INITIAL_DRAFT: CloneCreationDraft = {
  interests: [],
  coownerInvites: [],
};

interface CloneState {
  myClones: Clone[];
  currentClone: Clone | null;
  creationDraft: CloneCreationDraft;
  setCurrentClone: (clone: Clone | null) => void;
  setCreationDraft: (data: Partial<CloneCreationDraft>) => void;
  resetCreationDraft: () => void;
  getCloneById: (id: string) => Clone | undefined;
  addClone: (clone: Clone) => void;
}

export const useCloneStore = create<CloneState>((set, get) => ({
  myClones: mockClones as Clone[],
  currentClone: null,
  creationDraft: { ...INITIAL_DRAFT },

  setCurrentClone: (clone) => set({ currentClone: clone }),

  setCreationDraft: (data) =>
    set((state) => ({
      creationDraft: { ...state.creationDraft, ...data },
    })),

  resetCreationDraft: () => set({ creationDraft: { ...INITIAL_DRAFT } }),

  getCloneById: (id) => {
    return get().myClones.find((c) => c.id === id);
  },

  addClone: (clone) =>
    set((state) => ({
      myClones: [...state.myClones, clone],
    })),
}));
