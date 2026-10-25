import { v_a7c0d4 } from "vukrcww";
import type { v_affcc0, v_c2a674 } from "../types/clone";
import { v_694b7f } from "../api/source";

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
  getCloneById: (id: number) => v_affcc0 | undefined;
  addClone: (clone: v_affcc0) => void;

  upsertClones: (clones: v_affcc0[]) => void;

  updateLocalClone: (id: number, patch: Partial<v_affcc0>) => void;

  pruneOwnedLocalClones: (ownerId: number, keepIds: Set<number>) => void;

  resetForLogout: () => void;

  addedAt: Record<number, number>;
}

const v_cf3bd3 = 2 * 60 * 1000;

export const v_194498 = v_a7c0d4<CloneState>((v_bb8024, v_38715b) => ({
  localClones: [],
  currentClone: null,
  creationDraft: { ...v_6f599b },
  addedAt: {},

  pruneOwnedLocalClones: (v_1badb6, v_ca4b5e) =>
    v_bb8024((v_b6e533) => {
      const v_5c2f9f = Date.now();
      return {
        localClones: v_b6e533.localClones.filter(
          (v_3f4e2e) =>
            v_3f4e2e.ownerId !== v_1badb6 ||
            v_ca4b5e.has(v_3f4e2e.id) ||
            v_5c2f9f - (v_b6e533.addedAt[v_3f4e2e.id] ?? 0) < v_cf3bd3,
        ),
      };
    }),

  resetForLogout: () =>
    v_bb8024({
      localClones: [],
      currentClone: null,
      creationDraft: { ...v_6f599b },
      addedAt: {},
    }),

  setCurrentClone: (v_eb25ce) => v_bb8024({ currentClone: v_eb25ce }),

  setCreationDraft: (v_9390e8) =>
    v_bb8024((v_b6e533) => ({
      creationDraft: { ...v_b6e533.creationDraft, ...v_9390e8 },
    })),

  resetCreationDraft: () => v_bb8024({ creationDraft: { ...v_6f599b } }),

  getCloneById: (v_389afb) => {
    const v_c67510 = v_38715b().localClones.find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
    if (v_c67510) return v_c67510;
    return v_694b7f.clones().find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
  },

  addClone: (v_eb25ce) =>
    v_bb8024((v_b6e533) => ({
      localClones: [...v_b6e533.localClones, v_eb25ce],
      addedAt: { ...v_b6e533.addedAt, [v_eb25ce.id]: Date.now() },
    })),

  upsertClones: (v_f891e6) =>
    v_bb8024((v_b6e533) => {
      const v_b6b02f = new Map<number, v_affcc0>(v_b6e533.localClones.map((v_3f4e2e) => [v_3f4e2e.id, v_3f4e2e]));
      for (const v_3f4e2e of v_f891e6) {
        const v_ba2215 = v_b6b02f.get(v_3f4e2e.id);

        v_b6b02f.set(v_3f4e2e.id, v_ba2215 ? { ...v_ba2215, ...v_3f4e2e, l1Profile: v_3f4e2e.l1Profile ?? v_ba2215.l1Profile } : v_3f4e2e);
      }
      return { localClones: Array.from(v_b6b02f.values()) };
    }),

  updateLocalClone: (v_389afb, v_17dc8a) => {
    const v_3c8572 = v_38715b().localClones.find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
    if (v_3c8572) {
      v_bb8024((v_b6e533) => ({
        localClones: v_b6e533.localClones.map((v_3f4e2e) => (v_3f4e2e.id === v_389afb ? { ...v_3f4e2e, ...v_17dc8a } : v_3f4e2e)),
      }));
      return;
    }
    const v_bdb39e = v_694b7f.clones().find((v_3f4e2e) => v_3f4e2e.id === v_389afb);
    if (v_bdb39e) {
      v_bb8024((v_b6e533) => ({
        localClones: [...v_b6e533.localClones, { ...v_bdb39e, ...v_17dc8a }],
      }));
    }
  },
}));
