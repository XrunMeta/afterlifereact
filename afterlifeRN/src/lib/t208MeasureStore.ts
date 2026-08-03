

import AsyncStorage from "@react-native-async-storage/async-storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { T208SilhouetteScale } from "./t208SilhouetteScale";
import { T208_SILHOUETTE_SCALES, setSilhouetteScale } from "./t208SilhouetteScale";

export type T208CropRecord = {
  scale: T208SilhouetteScale;
  uri: string;
  savedAt: number;
};

const STORAGE_KEY = "t208.crops.v1";

const crops = new Map<number, T208CropRecord>();
const listeners = new Set<() => void>();
let hydrated = false;

function notify() {
  listeners.forEach((l) => l());
}

async function persist(): Promise<void> {
  if (!__DEV__) return;
  const data: T208CropRecord[] = T208_SILHOUETTE_SCALES.map((s) => crops.get(s)).filter(
    (r): r is T208CropRecord => !!r,
  );
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[T-208] crops persist failed", e);
  }
}

async function durableCopy(uri: string): Promise<string> {
  try {
    const out = await manipulateAsync(uri, [], { compress: 0.92, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return uri;
  }
}

export async function hydrateT208Crops(): Promise<void> {
  if (!__DEV__ || hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as T208CropRecord[];
    if (!Array.isArray(parsed)) return;
    for (const row of parsed) {
      if (!(T208_SILHOUETTE_SCALES as readonly number[]).includes(row.scale)) continue;
      if (typeof row.uri !== "string" || !row.uri) continue;
      crops.set(row.scale, {
        scale: row.scale,
        uri: row.uri,
        savedAt: typeof row.savedAt === "number" ? row.savedAt : Date.now(),
      });
    }
    notify();
  } catch (e) {
    console.warn("[T-208] crops hydrate failed", e);
  }
}

export async function recordT208Crop(scale: number, uri: string): Promise<void> {
  if (!__DEV__) return;
  if (!(T208_SILHOUETTE_SCALES as readonly number[]).includes(scale as T208SilhouetteScale)) {
    return;
  }
  const durableUri = await durableCopy(uri);
  crops.set(scale, {
    scale: scale as T208SilhouetteScale,
    uri: durableUri,
    savedAt: Date.now(),
  });
  notify();
  await persist();
}

export function getT208Crops(): T208CropRecord[] {
  return T208_SILHOUETTE_SCALES.map((s) => crops.get(s)).filter(
    (r): r is T208CropRecord => !!r,
  );
}

export function getT208Crop(scale: number): T208CropRecord | undefined {
  return crops.get(scale);
}

export async function clearT208Crops(): Promise<void> {
  crops.clear();
  notify();
  if (!__DEV__) return;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[T-208] crops clear failed", e);
  }
}

export function t208CropsSummary(): string {
  return T208_SILHOUETTE_SCALES.map((s) => {
    const done = crops.has(s);
    return `${s}: ${done ? "✓" : "·"}`;
  }).join("  ");
}

export function t208AllCropsReady(): boolean {
  return T208_SILHOUETTE_SCALES.every((s) => crops.has(s));
}

export function advanceT208ToNextIncompleteScale(): T208SilhouetteScale | null {
  if (!__DEV__) return null;
  const next = T208_SILHOUETTE_SCALES.find((s) => !crops.has(s));
  if (next == null) return null;
  setSilhouetteScale(next);
  return next;
}

export function subscribeT208Crops(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
