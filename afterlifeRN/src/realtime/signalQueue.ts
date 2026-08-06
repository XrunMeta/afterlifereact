

import type { v_9d43cd } from './avatarCall';

export const v_241565 = 256;

const EMPTY: readonly v_9d43cd[] = [];

export function v_020651(
  prev: readonly v_9d43cd[],
  sig: v_9d43cd,
): v_9d43cd[] {
  const v_a448ad = v_ba2215.concat([v_f2c979]);
  return v_a448ad.length > v_241565 ? v_a448ad.slice(v_a448ad.length - v_241565) : v_a448ad;
}

export function v_526a29(
  queue: readonly v_9d43cd[] | null | undefined,
  v_826f2f,
): readonly v_9d43cd[] {
  if (!v_e45ed0 || v_e45ed0.length === 0) return v_38b8f6;
  let v_ebec57 = v_e45ed0.length;
  while (v_ebec57 > 0 && v_e45ed0[v_ebec57 - 1].id > v_826f2f) v_ebec57 -= 1;
  if (v_ebec57 === v_e45ed0.length) return v_38b8f6;
  return v_ebec57 === 0 ? v_e45ed0 : v_e45ed0.slice(v_ebec57);
}

export function v_64f859(taken: readonly v_9d43cd[], v_826f2f): number {
  return v_e68f9f.length > 0 ? v_e68f9f[v_e68f9f.length - 1].id : v_826f2f;
}
