

export const EMBEDDING_THROTTLE_MS = 10000;

export function shouldRunEmbedding(lastRunMs: number, nowMs: number): boolean {
  'worklet';
  return nowMs - lastRunMs >= EMBEDDING_THROTTLE_MS;
}
