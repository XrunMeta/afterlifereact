import { v_a64bce } from "../../src/face/l2normalize";

it("정규화 후 노름 1", () => {
  const v_81e2ef = v_a64bce(new Float32Array([3, 4, ...Array(510).fill(0)]));
  expect(Math.hypot(...v_81e2ef)).toBeCloseTo(1, 5);
});

it("영벡터는 그대로(0) 반환", () => {
  expect(v_a64bce(new Float32Array(512))[0]).toBe(0);
});

it("plain number[] 를 반환 (전송용)", () => {
  const v_81e2ef = v_a64bce(new Float32Array([1, 0, ...Array(510).fill(0)]));
  expect(Array.isArray(v_81e2ef)).toBe(true);
  expect(v_81e2ef).toHaveLength(512);
});
