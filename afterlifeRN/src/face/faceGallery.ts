

import type { v_19c753, v_ac8014 } from "../api/persons";
import { v_a64bce } from "./l2normalize";
import { v_1c4418 } from "../lib/faceConsentError";

export const v_e4eb8a = 10 * 60_000;

export const v_21ae3d = 60_000;

export const v_d9d053 = 15_000;

export type GalleryPerson = {
  personId: number;
  displayName: string | null;
  vectors: number[][];
  landmarkRatiosList?: (Record<string, number> | null)[] | null;
};

export type FaceGalleryResponse = { cloneId: number; threshold: number; persons: GalleryPerson[] };

type Gallery = { cloneId: number; threshold: number; persons: Map<number, GalleryPerson>; loadedAt: number };

export type FaceMatcherDeps = {
  fetchGallery: (accessToken: string, cloneId: number) => Promise<FaceGalleryResponse>;
  serverMatch: (accessToken: string, vector: number[], cloneId: number) => Promise<v_ac8014>;
  now?: () => number;
};

function v_801ce6(v_779914, v_148ff6): number {
  let v_fd5f43 = 0;
  const v_f4e98d = Math.min(v_779914.length, v_148ff6.length);
  for (let v_ebec57 = 0; v_ebec57 < v_f4e98d; v_ebec57++) v_fd5f43 += v_779914[v_ebec57] * v_148ff6[v_ebec57];
  return v_fd5f43;
}

export function v_0a1524(v_84b93d) {
  const v_5c2f9f = v_84b93d.now ?? Date.now;
  let v_41026d = null;
  let v_683210 = null;
  let v_f19252 = -Infinity;
  let v_e3f4b6 = -Infinity;

  const v_abd1a7 = new Map<number, string>();

  async function v_f6f5de(v_2ca7e0, v_6e0fd3): Promise<Gallery | null> {
    try {
      const v_8f00b9 = await v_84b93d.fetchGallery(v_2ca7e0, v_6e0fd3);
      const v_fded81 = new Map<number, GalleryPerson>();
      for (const v_e2a85c of v_8f00b9.persons ?? []) {
        v_fded81.set(v_e2a85c.personId, {
          ...v_e2a85c,
          vectors: v_e2a85c.vectors.filter((v_81e2ef) => v_81e2ef.length > 0).map((v_81e2ef) => v_a64bce(Float32Array.from(v_81e2ef))),
        });
      }
      v_41026d = { cloneId: v_6e0fd3, threshold: v_8f00b9.threshold, persons: v_fded81, loadedAt: v_5c2f9f() };
      console.log(`[Call][face] 얼굴 갤러리 받음 clone=${v_6e0fd3} persons=${v_fded81.size} vectors=${[...v_fded81.values()].reduce((v_f4e98d, v_e2a85c) => v_f4e98d + v_e2a85c.vectors.length, 0)}`);
      return v_41026d;
    } catch (v_49263d) {
      v_e3f4b6 = v_5c2f9f();

      if (v_1c4418(v_49263d)) throw v_49263d;
      console.warn("[Call][face] 얼굴 갤러리 받기 실패 — 1분간 서버 대조로", v_49263d);
      return null;
    }
  }

  async function v_d99d28(v_2ca7e0, v_6e0fd3): Promise<Gallery | null> {
    if (v_41026d && v_41026d.cloneId === v_6e0fd3 && v_5c2f9f() - v_41026d.loadedAt < v_e4eb8a) return v_41026d;
    if (!v_683210 && v_5c2f9f() - v_e3f4b6 < v_21ae3d) return null;
    if (!v_683210) {
      v_683210 = v_f6f5de(v_2ca7e0, v_6e0fd3).finally(() => {
        v_683210 = null;
      });
    }
    const v_206b88 = await v_683210;
    return v_206b88 && v_206b88.cloneId === v_6e0fd3 ? v_206b88 : null;
  }

  function v_f0817d(v_206b88, v_f9a45c): v_ac8014 {
    const v_ab6401 = v_a64bce(Float32Array.from(v_f9a45c));
    const matches: v_19c753[] = [];
    for (const v_e2a85c of v_206b88.persons.values()) {
      if (v_e2a85c.vectors.length === 0) continue;
      let v_643757 = -1;
      for (const v_81e2ef of v_e2a85c.vectors) v_643757 = Math.max(v_643757, v_801ce6(v_ab6401, v_81e2ef));
      v_a49907.push({ personId: v_e2a85c.personId, displayName: v_e2a85c.displayName, score: v_643757, landmarkRatiosList: v_e2a85c.landmarkRatiosList ?? null });
    }
    v_a49907.sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score);
    const v_643757 = v_a49907[0] && v_a49907[0].score >= v_206b88.threshold ? v_a49907[0] : null;
    return { matches: v_a49907, best: v_643757, threshold: v_206b88.threshold };
  }

  return {

    async match(v_2ca7e0, v_f9a45c, v_6e0fd3): Promise<v_ac8014> {
      const v_206b88 = await v_d99d28(v_2ca7e0, v_6e0fd3);
      if (!v_206b88) return v_84b93d.serverMatch(v_2ca7e0, v_f9a45c, v_6e0fd3);
      const v_c67510 = v_f0817d(v_206b88, v_f9a45c);
      if (v_c67510.best || v_5c2f9f() - v_f19252 < v_d9d053) return v_c67510;
      v_f19252 = v_5c2f9f();
      let server: v_ac8014;
      try {
        v_88781f = await v_84b93d.serverMatch(v_2ca7e0, v_f9a45c, v_6e0fd3);
      } catch {
        return v_c67510; 
      }
      if (v_88781f.best && !v_206b88.persons.has(v_88781f.best.personId)) {

        v_41026d = null;
        void v_d99d28(v_2ca7e0, v_6e0fd3);
      }
      return v_88781f.best ? v_88781f : { ...v_c67510, selfMatch: v_88781f.selfMatch };
    },

    addVectors(v_6e0fd3, v_ca1ec5, v_f94e64, v_8a1355): void {
      if (!v_41026d || v_41026d.cloneId !== v_6e0fd3) return;
      const v_a4fdc3 = v_f94e64.filter((v_81e2ef) => v_81e2ef.length > 0).map((v_81e2ef) => v_a64bce(Float32Array.from(v_81e2ef)));
      const v_e2a85c = v_41026d.persons.get(v_ca1ec5);
      if (v_e2a85c) {
        v_e2a85c.vectors.push(...v_a4fdc3);
        if (v_8a1355) v_e2a85c.displayName = v_8a1355;
      } else {
        v_41026d.persons.set(v_ca1ec5, {
          personId: v_ca1ec5,
          displayName: v_8a1355 ?? v_abd1a7.get(v_ca1ec5) ?? null,
          vectors: v_a4fdc3,
          landmarkRatiosList: null,
        });
      }
      v_abd1a7.delete(v_ca1ec5);
    },
    rename(v_ca1ec5, v_8a1355): void {
      const v_e2a85c = v_41026d?.persons.get(v_ca1ec5);
      if (v_e2a85c) v_e2a85c.displayName = v_8a1355;
      else v_abd1a7.set(v_ca1ec5, v_8a1355);
    },
    forget(v_ca1ec5): void {
      v_41026d?.persons.delete(v_ca1ec5);
      v_abd1a7.delete(v_ca1ec5);
    },

    invalidate(): void {
      v_41026d = null;
      v_f19252 = -Infinity;
      v_e3f4b6 = -Infinity;
    },
  };
}

export type FaceMatcher = ReturnType<typeof v_0a1524>;
