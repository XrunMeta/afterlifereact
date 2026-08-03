

export const v_ba52cf = [0.75, 0.5, 0.4] as const;
export type T208SilhouetteScale = (typeof v_ba52cf)[number];

export const v_701c9e = 0.75 as const;

const v_9fde29 = new Set<() => void>();

let v_768f0b = false;
let v_1e8cf7 = v_701c9e;

function v_c226a5() {
  v_9fde29.forEach((v_1614db) => v_1614db());
}

export function v_6036cc(): boolean {
  return __DEV__ && v_768f0b;
}

export function v_eab35e(v_abacaa): void {
  if (!__DEV__) return;
  v_768f0b = v_abacaa;
  if (v_abacaa) {

    v_1e8cf7 = 0.75;
  } else {
    v_1e8cf7 = v_701c9e;
  }
  v_c226a5();
}

export function v_069313(): number {
  if (!__DEV__) return v_701c9e;
  if (!v_768f0b) return v_701c9e;
  return v_1e8cf7;
}

export function v_332d17(v_a37637): void {
  if (!__DEV__ || !v_768f0b) return;
  if (!(v_ba52cf as readonly number[]).includes(v_a37637)) return;
  v_1e8cf7 = v_a37637;
  v_c226a5();
}

export function v_a1a567(): T208SilhouetteScale {
  if (!__DEV__ || !v_768f0b) return v_701c9e;
  const v_e86ad8 = v_ba52cf.indexOf(v_1e8cf7);
  const v_a448ad = v_ba52cf[(v_e86ad8 < 0 ? 0 : v_e86ad8 + 1) % v_ba52cf.length];
  v_332d17(v_a448ad);
  return v_a448ad;
}

export function v_d43608(v_8b0dd9): () => void {
  v_9fde29.add(v_8b0dd9);
  return () => {
    v_9fde29.delete(v_8b0dd9);
  };
}

export function v_8b5209(v_a37637 = v_069313()): string {
  if (v_a37637 === 0.75) return "1·큼(0.75)";
  if (v_a37637 === 0.4) return "3·작음(0.40)";
  if (v_a37637 === 0.5) return "2·중간(0.50)";
  return `배율(${v_a37637})`;
}
