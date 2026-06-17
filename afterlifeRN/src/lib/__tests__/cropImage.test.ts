import { v_f98917, v_e70373 } from "../cropImage";

describe("baseCoverScale", () => {
  it("정사각 이미지에 1:2 프레임 → 더 큰 축(세로) 기준", () => {
    expect(v_f98917({ width: 1000, height: 1000 }, { width: 100, height: 200 })).toBeCloseTo(0.2);
  });

  it("portrait 이미지(600x1200)에 1:2 프레임(100x200) → max(100/600, 200/1200)=0.1667", () => {

    expect(v_f98917({ width: 600, height: 1200 }, { width: 100, height: 200 })).toBeCloseTo(1 / 6);
  });

  it("landscape 이미지(1200x600)에 1:2 프레임(100x200) → max(100/1200, 200/600)=0.333", () => {

    expect(v_f98917({ width: 1200, height: 600 }, { width: 100, height: 200 })).toBeCloseTo(1 / 3);
  });
});

describe("computeCropRect", () => {
  const v_7ddb73 = { width: 1000, height: 1000 };
  const v_143cb5 = { width: 100, height: 200 }; 
  const v_0288f8 = { translateX: 0, translateY: 0, scale: 1 };

  it("줌=1·중앙: 세로 가득, 가로 중앙, 비율 1:2", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, v_0288f8);
    expect(v_cb35cb).toEqual({ originX: 250, originY: 0, width: 500, height: 1000 });
    expect(v_cb35cb.height / v_cb35cb.width).toBeCloseTo(2);
  });

  it("이미지를 오른쪽으로 pan하면 crop 원점이 왼쪽으로 이동", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: 20, translateY: 0, scale: 1 });
    expect(v_cb35cb.originX).toBeCloseTo(150);
  });

  it("scale<1은 1로 클램프(여백 방지)", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: 0, translateY: 0, scale: 0.5 });
    expect(v_cb35cb).toEqual({ originX: 250, originY: 0, width: 500, height: 1000 });
  });

  it("과도한 pan은 이미지 경계로 클램프", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: 99999, translateY: 0, scale: 1 });
    expect(v_cb35cb.originX).toBe(0);
    expect(v_cb35cb.originX + v_cb35cb.width).toBeLessThanOrEqual(v_7ddb73.width);
  });

  it("줌인하면 crop 영역이 작아지고 비율은 1:2 유지", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: 0, translateY: 0, scale: 2 });
    expect(v_cb35cb.width).toBeCloseTo(250);
    expect(v_cb35cb.height).toBeCloseTo(500);
    expect(v_cb35cb.height / v_cb35cb.width).toBeCloseTo(2);
  });

  it("portrait 이미지(600x1200): center gesture → 이미지 내부 rect, 비율 1:2", () => {
    const v_48a672 = { width: 600, height: 1200 };
    const v_cb35cb = v_e70373(v_48a672, v_143cb5, v_0288f8);
    expect(v_cb35cb.originX).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.originY).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.originX + v_cb35cb.width).toBeLessThanOrEqual(v_48a672.width);
    expect(v_cb35cb.originY + v_cb35cb.height).toBeLessThanOrEqual(v_48a672.height);
    expect(v_cb35cb.height / v_cb35cb.width).toBeCloseTo(2);
  });

  it("translateY 세로 pan: 세로 여유 있는 이미지에서 translateY=50이면 originY가 translateY=0보다 작아짐", () => {

    const v_0eb443 = { width: 1000, height: 4000 };
    const v_694b25 = v_e70373(v_0eb443, v_143cb5, v_0288f8);
    const v_3acf39 = v_e70373(v_0eb443, v_143cb5, { translateX: 0, translateY: 50, scale: 1 });
    expect(v_3acf39.originY).toBeLessThan(v_694b25.originY);
  });

  it("translateY 과도한 음수 pan: 하단 경계 클램프(originY+height≤image.height)", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: 0, translateY: -99999, scale: 1 });
    expect(v_cb35cb.originY + v_cb35cb.height).toBeLessThanOrEqual(v_7ddb73.height);
  });

  it("음수 translateX 과도한 pan: originX+width≤image.width 경계 클램프", () => {
    const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, { translateX: -99999, translateY: 0, scale: 1 });
    expect(v_cb35cb.originX + v_cb35cb.width).toBeLessThanOrEqual(v_7ddb73.width);
  });

  it("이미지가 프레임보다 작은 경우: NaN/음수 없이 이미지 내부 rect 반환", () => {
    const v_27dfc1 = { width: 50, height: 50 };
    const v_cb35cb = v_e70373(v_27dfc1, v_143cb5, v_0288f8);
    expect(isNaN(v_cb35cb.originX)).toBe(false);
    expect(isNaN(v_cb35cb.originY)).toBe(false);
    expect(isNaN(v_cb35cb.width)).toBe(false);
    expect(isNaN(v_cb35cb.height)).toBe(false);
    expect(v_cb35cb.originX).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.originY).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.originX + v_cb35cb.width).toBeLessThanOrEqual(v_27dfc1.width);
    expect(v_cb35cb.originY + v_cb35cb.height).toBeLessThanOrEqual(v_27dfc1.height);
  });

  it("0-dimension: throw", () => {
    expect(() => v_e70373({ width: 0, height: 0 }, v_143cb5, v_0288f8)).toThrow();
    expect(() => v_e70373({ width: 0, height: 100 }, v_143cb5, v_0288f8)).toThrow();
    expect(() => v_e70373({ width: 100, height: 0 }, v_143cb5, v_0288f8)).toThrow();
  });
});
