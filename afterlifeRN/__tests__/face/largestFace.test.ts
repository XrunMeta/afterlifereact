import { largestFace } from "../../src/face/largestFace";

it("빈 배열 → null", () => {
  expect(largestFace([])).toBeNull();
});

it("단일 얼굴 → 그 얼굴 반환", () => {
  const f = { bounds: { x: 0, y: 0, width: 100, height: 100 } };
  expect(largestFace([f])).toBe(f);
});

it("면적이 가장 큰 얼굴을 선택", () => {
  const small = { bounds: { x: 0, y: 0, width: 50, height: 50 }, trackingId: 1 };
  const big = { bounds: { x: 0, y: 0, width: 200, height: 200 }, trackingId: 2 };
  const mid = { bounds: { x: 0, y: 0, width: 100, height: 100 }, trackingId: 3 };
  expect(largestFace([small, big, mid])).toBe(big);
});

it("동률이면 먼저 나온 얼굴 유지", () => {
  const a = { bounds: { x: 0, y: 0, width: 100, height: 100 }, trackingId: 1 };
  const b = { bounds: { x: 10, y: 10, width: 100, height: 100 }, trackingId: 2 };
  expect(largestFace([a, b])).toBe(a);
});
