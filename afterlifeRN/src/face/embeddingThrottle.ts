

export const EMBEDDING_THROTTLE_MS = 1000;

export function shouldRunEmbedding(lastRunMs: number, nowMs: number): boolean {
  return nowMs - lastRunMs >= EMBEDDING_THROTTLE_MS;
}
