import {
  baseCoverScale,
  clampGestureScale,
  clampPanOffset,
  computeCropRect,
  coversCropArea,
  ZOOM_MAX,
  ZOOM_MIN,
} from "../cropImage";

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

describe("clampGestureScale", () => {
  it("ZOOM_MIN 미만은 ZOOM_MIN으로 클램프", () => {
    expect(clampGestureScale(0.1)).toBe(ZOOM_MIN);
    expect(clampGestureScale(-5)).toBe(ZOOM_MIN);
  });

  it("ZOOM_MAX 초과는 ZOOM_MAX으로 클램프", () => {
    expect(clampGestureScale(999)).toBe(ZOOM_MAX);
  });

  it("범위 내 값은 그대로 통과", () => {
    expect(clampGestureScale(3.5)).toBe(3.5);
    expect(clampGestureScale(0.5)).toBe(0.5);
  });

  it("커스텀 min/max 오버라이드", () => {
    expect(clampGestureScale(50, 2, 20)).toBe(20);
    expect(clampGestureScale(1, 2, 20)).toBe(2);
  });
});

describe("clampPanOffset", () => {
  const image = { width: 1000, height: 1000 };
  const frame = { width: 100, height: 200 }; 

  it("scale=1(커버 배율)에서 offset=0은 그대로 0", () => {
    expect(clampPanOffset(image, frame, 1, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("scale=1에서는 여유가 X축에만 존재(Y축은 여유 없음 → 0으로 클램프)", () => {

    const r = clampPanOffset(image, frame, 1, { x: 999, y: 999 });
    expect(r.x).toBeCloseTo(50);
    expect(r.y).toBe(0);
  });

  it("확대(scale=2)하면 허용 오프셋 범위가 넓어짐", () => {

    const r = clampPanOffset(image, frame, 2, { x: 999, y: 999 });
    expect(r.x).toBeCloseTo(150);
    expect(r.y).toBeCloseTo(100);
  });

  it("범위 내 offset은 그대로 통과", () => {
    const r = clampPanOffset(image, frame, 2, { x: 10, y: -20 });
    expect(r).toEqual({ x: 10, y: -20 });
  });

  it("음수 방향도 대칭 클램프", () => {
    const r = clampPanOffset(image, frame, 1, { x: -999, y: -999 });
    expect(r.x).toBeCloseTo(-50);
    expect(r.y).toBeCloseTo(0);
  });

  it("축소(scale=0.5)에서는 프레임 안 패닝 여유", () => {

    const r = clampPanOffset(image, frame, 0.5, { x: 999, y: 999 });
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(50);
  });
});

describe("coversCropArea", () => {
  const image = { width: 1000, height: 1000 };
  const frame = { width: 100, height: 200 };
  const layout = { image, frame };

  it("scale=1·offset=0(중앙 정렬 커버 배율): 항상 덮음 → true", () => {
    expect(coversCropArea(layout, 1, { x: 0, y: 0 })).toBe(true);
  });

  it("clampPanOffset이 반환한 경계값은 항상 덮음 → true", () => {
    const clamped = clampPanOffset(image, frame, 1, { x: 999, y: 999 });
    expect(coversCropArea(layout, 1, clamped)).toBe(true);
  });

  it("클램프 경계를 벗어난 offset은 덮지 못함 → false", () => {
    expect(coversCropArea(layout, 1, { x: 51, y: 0 })).toBe(false);
    expect(coversCropArea(layout, 1, { x: 0, y: 1 })).toBe(false);
  });

  it("확대(scale=2) 상태에서 확대 전 최대 offset은 이제 덮음 → true", () => {
    expect(coversCropArea(layout, 2, { x: 50, y: 0 })).toBe(true);
  });

  it("축소(scale=0.5)에서도 팬이 경계 내면 true(레터박스 허용)", () => {
    expect(coversCropArea(layout, 0.5, { x: 0, y: 0 })).toBe(true);
  });

  it("오차 허용범위(EPS) 이내의 미세 초과는 true로 관대하게 판정", () => {
    expect(coversCropArea(layout, 1, { x: 50.3, y: 0 })).toBe(true);
  });
});
