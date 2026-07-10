import { shouldRunEmbedding, EMBEDDING_THROTTLE_MS as T } from "../../src/face/embeddingThrottle";

it("스로틀 간격 미만이면 false, 이상이면 true", () => {
  expect(shouldRunEmbedding(T, T + T - 1)).toBe(false);
  expect(shouldRunEmbedding(T, T + T)).toBe(true);
});

it("경계 초과도 true", () => {
  expect(shouldRunEmbedding(T, T + T + 500)).toBe(true);
});

it("lastRunMs가 0이고 nowMs가 스로틀 간격 이상이면 true", () => {
  expect(shouldRunEmbedding(0, T)).toBe(true);
});
