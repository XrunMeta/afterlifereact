import { v_e74bab } from "../../src/face/largestFace";

it("빈 배열 → null", () => {
  expect(v_e74bab([])).toBeNull();
});

it("단일 얼굴 → 그 얼굴 반환", () => {
  const v_8b5cd8 = { bounds: { x: 0, y: 0, width: 100, height: 100 } };
  expect(v_e74bab([v_8b5cd8])).toBe(v_8b5cd8);
});

it("면적이 가장 큰 얼굴을 선택", () => {
  const v_f5dbce = { bounds: { x: 0, y: 0, width: 50, height: 50 }, trackingId: 1 };
  const v_fdfe85 = { bounds: { x: 0, y: 0, width: 200, height: 200 }, trackingId: 2 };
  const v_73ad51 = { bounds: { x: 0, y: 0, width: 100, height: 100 }, trackingId: 3 };
  expect(v_e74bab([v_f5dbce, v_fdfe85, v_73ad51])).toBe(v_fdfe85);
});

it("동률이면 먼저 나온 얼굴 유지", () => {
  const v_779914 = { bounds: { x: 0, y: 0, width: 100, height: 100 }, trackingId: 1 };
  const v_148ff6 = { bounds: { x: 10, y: 10, width: 100, height: 100 }, trackingId: 2 };
  expect(v_e74bab([v_779914, v_148ff6])).toBe(v_779914);
});
