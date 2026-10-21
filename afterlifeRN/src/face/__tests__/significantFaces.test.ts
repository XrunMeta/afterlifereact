import { v_e74bab, v_9ad8b5 } from "../largestFace";

const v_7d769d = (v_8e4fb6, v_3d87e5) => ({
  bounds: { x: 0, y: 0, width: v_8e4fb6, height: v_8e4fb6 },
  trackingId: v_3d87e5,
});

describe("significantFaces", () => {
  it("primary 폭의 절반 미만인 작은 얼굴은 뺀다", () => {
    const v_a51d09 = [v_7d769d(300, 1), v_7d769d(60, 2)];
    expect(v_9ad8b5(v_a51d09, v_e74bab(v_a51d09)).map((v_8b5cd8) => v_8b5cd8.trackingId)).toEqual([1]);
  });

  it("비슷한 크기의 두 번째 얼굴은 남긴다", () => {
    const v_a51d09 = [v_7d769d(300, 1), v_7d769d(200, 2)];
    expect(v_9ad8b5(v_a51d09, v_e74bab(v_a51d09)).map((v_8b5cd8) => v_8b5cd8.trackingId)).toEqual([1, 2]);
  });

  it("얼굴이 없으면 빈 배열", () => {
    expect(v_9ad8b5([], null)).toEqual([]);
  });
});
