import { EmbeddingBuffer } from "../../src/face/embeddingBuffer";

it("push 6개 → latest(5)는 최근 5개", () => {
  const buf = new EmbeddingBuffer();
  for (let i = 0; i < 6; i++) buf.push([i]);
  const latest = buf.latest(5);
  expect(latest).toHaveLength(5);
  expect(latest.map((v) => v[0])).toEqual([1, 2, 3, 4, 5]);
});

it("latest(3)은 최신순 3개", () => {
  const buf = new EmbeddingBuffer();
  for (let i = 0; i < 6; i++) buf.push([i]);
  const latest = buf.latest(3);
  expect(latest.map((v) => v[0])).toEqual([3, 4, 5]);
});

it("push 개수가 5 미만이면 latest(5)는 있는 만큼만 반환", () => {
  const buf = new EmbeddingBuffer();
  buf.push([10]);
  buf.push([20]);
  expect(buf.latest(5)).toEqual([[10], [20]]);
});
