import { l2normalize } from "../../src/face/l2normalize";

it("정규화 후 노름 1", () => {
  const v = l2normalize(new Float32Array([3, 4, ...Array(510).fill(0)]));
  expect(Math.hypot(...v)).toBeCloseTo(1, 5);
});

it("영벡터는 그대로(0) 반환", () => {
  expect(l2normalize(new Float32Array(512))[0]).toBe(0);
});

it("plain number[] 를 반환 (전송용)", () => {
  const v = l2normalize(new Float32Array([1, 0, ...Array(510).fill(0)]));
  expect(Array.isArray(v)).toBe(true);
  expect(v).toHaveLength(512);
});
