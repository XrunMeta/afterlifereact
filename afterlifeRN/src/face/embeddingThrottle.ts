

export const EMBEDDING_THROTTLE_MS = 2000;

export function shouldRunEmbedding(lastRunMs: number, nowMs: number): boolean {
  'worklet';
  return nowMs - lastRunMs >= EMBEDDING_THROTTLE_MS;
}
