import { baseCoverScale, computeCropRect } from "../cropImage";

describe("baseCoverScale", () => {
  it("정사각 이미지에 1:2 프레임 → 더 큰 축(세로) 기준", () => {
    expect(baseCoverScale({ width: 1000, height: 1000 }, { width: 100, height: 200 })).toBeCloseTo(0.2);
  });

  it("portrait 이미지(600x1200)에 1:2 프레임(100x200) → max(100/600, 200/1200)=0.1667", () => {

    expect(baseCoverScale({ width: 600, height: 1200 }, { width: 100, height: 200 })).toBeCloseTo(1 / 6);
  });

  it("landscape 이미지(1200x600)에 1:2 프레임(100x200) → max(100/1200, 200/600)=0.333", () => {

    expect(baseCoverScale({ width: 1200, height: 600 }, { width: 100, height: 200 })).toBeCloseTo(1 / 3);
  });
});

describe("computeCropRect", () => {
  const image = { width: 1000, height: 1000 };
  const frame = { width: 100, height: 200 }; 
  const center = { translateX: 0, translateY: 0, scale: 1 };

  it("줌=1·중앙: 세로 가득, 가로 중앙, 비율 1:2", () => {
    const r = computeCropRect(image, frame, center);
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

  it("portrait 이미지(600x1200): center gesture → 이미지 내부 rect, 비율 1:2", () => {
    const img = { width: 600, height: 1200 };
    const r = computeCropRect(img, frame, center);
    expect(r.originX).toBeGreaterThanOrEqual(0);
    expect(r.originY).toBeGreaterThanOrEqual(0);
    expect(r.originX + r.width).toBeLessThanOrEqual(img.width);
    expect(r.originY + r.height).toBeLessThanOrEqual(img.height);
    expect(r.height / r.width).toBeCloseTo(2);
  });

  it("translateY 세로 pan: 세로 여유 있는 이미지에서 translateY=50이면 originY가 translateY=0보다 작아짐", () => {

    const wideImg = { width: 1000, height: 4000 };
    const base = computeCropRect(wideImg, frame, center);
    const panned = computeCropRect(wideImg, frame, { translateX: 0, translateY: 50, scale: 1 });
    expect(panned.originY).toBeLessThan(base.originY);
  });

  it("translateY 과도한 음수 pan: 하단 경계 클램프(originY+height≤image.height)", () => {
    const r = computeCropRect(image, frame, { translateX: 0, translateY: -99999, scale: 1 });
    expect(r.originY + r.height).toBeLessThanOrEqual(image.height);
  });

  it("음수 translateX 과도한 pan: originX+width≤image.width 경계 클램프", () => {
    const r = computeCropRect(image, frame, { translateX: -99999, translateY: 0, scale: 1 });
    expect(r.originX + r.width).toBeLessThanOrEqual(image.width);
  });

  it("이미지가 프레임보다 작은 경우: NaN/음수 없이 이미지 내부 rect 반환", () => {
    const smallImage = { width: 50, height: 50 };
    const r = computeCropRect(smallImage, frame, center);
    expect(isNaN(r.originX)).toBe(false);
    expect(isNaN(r.originY)).toBe(false);
    expect(isNaN(r.width)).toBe(false);
    expect(isNaN(r.height)).toBe(false);
    expect(r.originX).toBeGreaterThanOrEqual(0);
    expect(r.originY).toBeGreaterThanOrEqual(0);
    expect(r.originX + r.width).toBeLessThanOrEqual(smallImage.width);
    expect(r.originY + r.height).toBeLessThanOrEqual(smallImage.height);
  });

  it("0-dimension: throw", () => {
    expect(() => computeCropRect({ width: 0, height: 0 }, frame, center)).toThrow();
    expect(() => computeCropRect({ width: 0, height: 100 }, frame, center)).toThrow();
    expect(() => computeCropRect({ width: 100, height: 0 }, frame, center)).toThrow();
  });
});
