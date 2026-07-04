import { shouldRunEmbedding } from "../../src/face/embeddingThrottle";

it("1000ms 미만이면 false, 이상이면 true", () => {
  expect(shouldRunEmbedding(1000, 1999)).toBe(false);
  expect(shouldRunEmbedding(1000, 2000)).toBe(true);
});

it("경계 초과(1000ms 초과)도 true", () => {
  expect(shouldRunEmbedding(1000, 2500)).toBe(true);
});

it("lastRunMs가 0이고 nowMs가 스로틀 간격 이상이면 true", () => {
  expect(shouldRunEmbedding(0, 1000)).toBe(true);
});
