

import type { v_19c753, v_ac8014 } from "../api/persons";
import { v_a64bce } from "./l2normalize";

export const v_c5ee03 = 10 * 60_000;

type Entry = {
  cloneId: number;
  personId: number;
  displayName: string | null;
  vectors: number[][];
  addedAt: number;
};

const v_1e6eca = new Map<number, Entry>();

function v_3353a2(v_779914, v_148ff6): number {
  let v_fd5f43 = 0;
  const v_f4e98d = Math.min(v_779914.length, v_148ff6.length);
  for (let v_ebec57 = 0; v_ebec57 < v_f4e98d; v_ebec57++) v_fd5f43 += v_779914[v_ebec57] * v_148ff6[v_ebec57];
  return v_fd5f43;
}

export function v_d65e3c(
  v_6e0fd3,
  v_ca1ec5,
  v_f94e64,
  v_8a1355,
  v_67e77e = Date.now(),
): void {
  const v_a4fdc3 = v_f94e64.filter((v_81e2ef) => v_81e2ef.length > 0).map((v_81e2ef) => v_a64bce(Float32Array.from(v_81e2ef)));
  const v_ba2215 = v_1e6eca.get(v_ca1ec5);
  if (v_ba2215 && v_ba2215.cloneId === v_6e0fd3) {
    v_ba2215.vectors.push(...v_a4fdc3);
    if (v_8a1355) v_ba2215.displayName = v_8a1355;
    v_ba2215.addedAt = v_67e77e;
    return;
  }
  v_1e6eca.set(v_ca1ec5, { cloneId: v_6e0fd3, personId: v_ca1ec5, displayName: v_8a1355 ?? null, vectors: v_a4fdc3, addedAt: v_67e77e });
}

export function v_b1f868(v_6e0fd3, v_ca1ec5, v_8a1355): void {
  const v_ba2215 = v_1e6eca.get(v_ca1ec5);
  if (v_ba2215) v_ba2215.displayName = v_8a1355;
  else v_1e6eca.set(v_ca1ec5, { cloneId: v_6e0fd3, personId: v_ca1ec5, displayName: v_8a1355, vectors: [], addedAt: Date.now() });
}

export function v_414d1f(v_ca1ec5, v_8a1355): void {
  const v_ba2215 = v_1e6eca.get(v_ca1ec5);
  if (v_ba2215) v_ba2215.displayName = v_8a1355;
}

export function v_9d3644(v_ca1ec5): void {
  v_1e6eca.delete(v_ca1ec5);
}

export function v_03e962(): void {
  v_1e6eca.clear();
}

export function v_686e50(
  result: v_ac8014,
  v_f9a45c,
  v_6e0fd3,
  v_67e77e = Date.now(),
): v_ac8014 {
  if (v_1e6eca.size === 0) return v_43c42e;
  const v_99d529 = new Set(v_43c42e.matches.map((v_35f85c) => v_35f85c.personId));
  const v_ab6401 = v_a64bce(Float32Array.from(v_f9a45c));
  const local: v_19c753[] = [];
  for (const v_9e86fd of [...v_1e6eca.values()]) {
    if (v_67e77e - v_9e86fd.addedAt > v_c5ee03 || v_99d529.has(v_9e86fd.personId)) {
      v_1e6eca.delete(v_9e86fd.personId);
      continue;
    }
    if (v_9e86fd.cloneId !== v_6e0fd3 || v_9e86fd.vectors.length === 0) continue;
    const v_740dd8 = Math.max(...v_9e86fd.vectors.map((v_81e2ef) => v_3353a2(v_ab6401, v_81e2ef)));
    v_c67510.push({ personId: v_9e86fd.personId, displayName: v_9e86fd.displayName, score: v_740dd8 });
  }
  if (v_c67510.length === 0) return v_43c42e;
  const v_a49907 = [...v_43c42e.matches, ...v_c67510].sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score);
  const v_fbc0a4 = v_c67510.reduce((v_779914, v_148ff6) => (v_148ff6.score > v_779914.score ? v_148ff6 : v_779914));
  const v_643757 =
    v_fbc0a4.score >= v_43c42e.threshold && (v_43c42e.best == null || v_fbc0a4.score > v_43c42e.best.score) ? v_fbc0a4 : v_43c42e.best;
  return { ...v_43c42e, matches: v_a49907, best: v_643757 };
}
