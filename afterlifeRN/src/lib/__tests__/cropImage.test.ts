import { baseCoverScale, computeCropRect } from "../cropImage";

describe("baseCoverScale", () => {
  it("정사각 이미지에 1:2 프레임 → 더 큰 축(세로) 기준", () => {
    expect(baseCoverScale({ width: 1000, height: 1000 }, { width: 100, height: 200 })).toBeCloseTo(0.2);
  });
});

describe("computeCropRect", () => {
  const image = { width: 1000, height: 1000 };
  const frame = { width: 100, height: 200 }; 

  it("줌=1·중앙: 세로 가득, 가로 중앙, 비율 1:2", () => {
    const r = computeCropRect(image, frame, { translateX: 0, translateY: 0, scale: 1 });
    expect(r).toEqual({ originX: 250, originY: 0, width: 500, height: 1000 });
    expect(r.height / r.width).toBeCloseTo(2);
  });

  it("이미지를 오른쪽으로 pan하면 crop 원점이 왼쪽으로 이동", () => {
    const r = computeCropRect(image, frame, { translateX: 20, translateY: 0, scale: 1 });
    expect(r.originX).toBeCloseTo(150);
  });

  it("scale<1은 1로 클램프(여백 방지)", () => {
    const r = computeCropRect(image, frame, { translateX: 0, translateY: 0, scale: 0.5 });
    expect(r).toEqual({ originX: 250, originY: 0, width: 500, height: 1000 });
  });

  it("과도한 pan은 이미지 경계로 클램프", () => {
    const r = computeCropRect(image, frame, { translateX: 99999, translateY: 0, scale: 1 });
    expect(r.originX).toBe(0);
    expect(r.originX + r.width).toBeLessThanOrEqual(image.width);
  });

  it("줌인하면 crop 영역이 작아지고 비율은 1:2 유지", () => {
    const r = computeCropRect(image, frame, { translateX: 0, translateY: 0, scale: 2 });
    expect(r.width).toBeCloseTo(250);
    expect(r.height).toBeCloseTo(500);
    expect(r.height / r.width).toBeCloseTo(2);
  });
});
