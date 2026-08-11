

export const EMBEDDING_THROTTLE_RELEASE_MS = 10000;

export const EMBEDDING_THROTTLE_DEV_MS = 3000;

export function resolveThrottleMs(isDev: boolean, envRaw?: string | null): number {
  const n = envRaw != null && envRaw !== "" ? Number(envRaw) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return isDev ? EMBEDDING_THROTTLE_DEV_MS : EMBEDDING_THROTTLE_RELEASE_MS;
}

export const EMBEDDING_THROTTLE_MS = resolveThrottleMs(
  typeof __DEV__ !== "undefined" && __DEV__,
  process.env.EXPO_PUBLIC_FACE_THROTTLE_MS,
);

export function shouldRunEmbedding(lastRunMs: number, nowMs: number): boolean {
  'worklet';
  return nowMs - lastRunMs >= EMBEDDING_THROTTLE_MS;
}
