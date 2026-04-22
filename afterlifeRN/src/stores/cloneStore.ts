import { v_a7c0d4 } from "vukrcww";
import type { v_affcc0, v_c2a674 } from "../types/clone";
import { v_35d5ed } from "../mocks/seedIndex";

const INITIAL_DRAFT: v_c2a674 = {
  interests: [],
  coownerInvites: [],
};

interface CloneState {
  localClones: v_affcc0[];
  currentClone: v_affcc0 | null;
  creationDraft: v_c2a674;
  setCurrentClone: (clone: v_affcc0 | null) => void;
  setCreationDraft: (data: Partial<v_c2a674>) => void;
  resetCreationDraft: () => void;
  getCloneById: (id: string) => v_affcc0 | undefined;
  addClone: (clone: v_affcc0) => void;
}

export const v_194498 = v_a7c0d4<CloneState>((v_bb8024, v_38715b) => ({
  localClones: [],
  currentClone: null,
  creationDraft: { ...v_6f599b },

  setCurrentClone: (v_eb25ce) => v_bb8024({ currentClone: v_eb25ce }),

  setCreationDraft: (v_9390e8) =>
    v_bb8024((v_b6e533) => ({
      creationDraft: { ...v_b6e533.creationDraft, ...v_9390e8 },
    })),

  resetCreationDraft: () => v_bb8024({ creationDraft: { ...v_6f599b } }),

  getCloneById: (v_389afb) => {
    const v_c67510 = v_38715b().localClones.find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
    if (v_c67510) return v_c67510;
    return v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
  },

  addClone: (v_eb25ce) =>
    v_bb8024((v_b6e533) => ({
      localClones: [...v_b6e533.localClones, v_eb25ce],
    })),
}));
