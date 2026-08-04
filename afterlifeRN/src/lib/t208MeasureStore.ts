

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";
import type { v_f8b11e } from "./t208SilhouetteScale";
import { v_ba52cf, v_332d17 } from "./t208SilhouetteScale";

export type T208CropRecord = {
  scale: v_f8b11e;
  uri: string;
  savedAt: number;
};

const v_b6c376 = "t208.crops.v1";

const v_818f38 = new Map<number, T208CropRecord>();
const v_9fde29 = new Set<() => void>();
let v_cc4b1d = false;

function v_c226a5() {
  v_9fde29.forEach((v_1614db) => v_1614db());
}

async function v_3c038e(): Promise<void> {
  if (!__DEV__) return;
  const v_9390e8 = v_ba52cf.map((v_fd5f43) => v_818f38.get(v_fd5f43)).filter(
    (v_cb35cb): v_cb35cb is T208CropRecord => !!v_cb35cb,
  );
  try {
    await v_e84827.setItem(v_b6c376, JSON.stringify(v_9390e8));
  } catch (v_9e86fd) {
    console.warn("[T-208] crops persist failed", v_9e86fd);
  }
}

async function v_cc67c0(v_cd1446): Promise<string> {
  try {
    const v_8d4337 = await v_516d20(v_cd1446, [], { compress: 0.92, format: v_91a3cf.JPEG });
    return v_8d4337.uri;
  } catch {
    return v_cd1446;
  }
}

export async function v_82d3c2(): Promise<void> {
  if (!__DEV__ || v_cc4b1d) return;
  v_cc4b1d = true;
  try {
    const v_479f05 = await v_e84827.getItem(v_b6c376);
    if (!v_479f05) return;
    const v_8decf8 = JSON.parse(v_479f05) as T208CropRecord[];
    if (!Array.isArray(v_8decf8)) return;
    for (const v_3ac7e7 of v_8decf8) {
      if (!(v_ba52cf as readonly number[]).includes(v_3ac7e7.scale)) continue;
      if (typeof v_3ac7e7.uri !== "string" || !v_3ac7e7.uri) continue;
      v_818f38.set(v_3ac7e7.scale, {
        scale: v_3ac7e7.scale,
        uri: v_3ac7e7.uri,
        savedAt: typeof v_3ac7e7.savedAt === "number" ? v_3ac7e7.savedAt : Date.now(),
      });
    }
    v_c226a5();
  } catch (v_9e86fd) {
    console.warn("[T-208] crops hydrate failed", v_9e86fd);
  }
}

export async function v_87a25c(v_a37637, v_cd1446): Promise<void> {
  if (!__DEV__) return;
  if (!(v_ba52cf as readonly number[]).includes(v_a37637 as v_f8b11e)) {
    return;
  }
  const v_3dd104 = await v_cc67c0(v_cd1446);
  v_818f38.set(v_a37637, {
    scale: v_a37637 as v_f8b11e,
    uri: v_3dd104,
    savedAt: Date.now(),
  });
  v_c226a5();
  await v_3c038e();
}

export function v_e4c8b0(): T208CropRecord[] {
  return v_ba52cf.map((v_fd5f43) => v_818f38.get(v_fd5f43)).filter(
    (v_cb35cb): v_cb35cb is T208CropRecord => !!v_cb35cb,
  );
}

export function v_a83290(v_a37637): T208CropRecord | undefined {
  return v_818f38.get(v_a37637);
}

export async function v_2c25c5(): Promise<void> {
  v_818f38.clear();
  v_c226a5();
  if (!__DEV__) return;
  try {
    await v_e84827.removeItem(v_b6c376);
  } catch (v_9e86fd) {
    console.warn("[T-208] crops clear failed", v_9e86fd);
  }
}

export function v_890a60(): string {
  return v_ba52cf.map((v_fd5f43) => {
    const v_2fb8cc = v_818f38.has(v_fd5f43);
    return `${v_fd5f43}: ${v_2fb8cc ? "✓" : "·"}`;
  }).join("  ");
}

export function v_951fee(): boolean {
  return v_ba52cf.every((v_fd5f43) => v_818f38.has(v_fd5f43));
}

export function v_d993b0(): v_f8b11e | null {
  if (!__DEV__) return null;
  const v_a448ad = v_ba52cf.find((v_fd5f43) => !v_818f38.has(v_fd5f43));
  if (v_a448ad == null) return null;
  v_332d17(v_a448ad);
  return v_a448ad;
}

export function v_38c04a(v_8b0dd9): () => void {
  v_9fde29.add(v_8b0dd9);
  return () => {
    v_9fde29.delete(v_8b0dd9);
  };
}
