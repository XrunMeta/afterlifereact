import {
  v_e2ddec,
  v_2c12f7,
  v_12b919,
  v_516b4f,
  v_fa192b,
  v_e24300,
  v_9871cb,
} from "../../src/face/faceAlignCrop";

describe("얼굴 crop — 바로 선 좌표 → 버퍼 좌표", () => {
  test("landscape-left 는 270°", () => {
    expect(v_516b4f("landscape-left")).toBe(270);
    expect(v_516b4f("landscape-right")).toBe(90);
    expect(v_516b4f("portrait")).toBe(0);
    expect(v_516b4f(undefined)).toBe(0);
  });

  test("270°: 바로 선 (x,y,w,h) → 버퍼 (W-y-h, x, h, w)", () => {
    expect(v_9871cb({ x: 100, y: 200, width: 120, height: 120 }, 640, 480, 270))
      .toEqual({ x: 320, y: 100, width: 120, height: 120 });
  });

  test("90°: 바로 선 (x,y,w,h) → 버퍼 (y, H-x-w, h, w)", () => {
    expect(v_9871cb({ x: 100, y: 200, width: 120, height: 120 }, 640, 480, 90))
      .toEqual({ x: 200, y: 260, width: 120, height: 120 });
  });

  test("0°·180°", () => {
    expect(v_9871cb({ x: 10, y: 20, width: 100, height: 100 }, 640, 480, 0))
      .toEqual({ x: 10, y: 20, width: 100, height: 100 });
    expect(v_9871cb({ x: 10, y: 20, width: 100, height: 100 }, 640, 480, 180))
      .toEqual({ x: 530, y: 360, width: 100, height: 100 });
  });

  test("버퍼 밖으로 나가지 않는다 — 실통화 덤프 값", () => {
    const v_cb35cb = v_9871cb({ x: 77.36, y: 290.55, width: 346.99, height: 346.99 }, 640, 480, 270);
    expect(v_cb35cb.x).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.y).toBeGreaterThanOrEqual(0);
    expect(v_cb35cb.x + v_cb35cb.width).toBeLessThanOrEqual(640);
    expect(v_cb35cb.y + v_cb35cb.height).toBeLessThanOrEqual(480);
    expect(v_cb35cb.width).toBe(v_cb35cb.height);
  });

  test("프레임보다 큰 사각형은 중심을 유지한 채 프레임에 맞게 줄인다", () => {
    const v_cb35cb = v_9871cb({ x: -50, y: -50, width: 900, height: 900 }, 640, 480, 0);
    expect(v_cb35cb).toEqual({ x: 160, y: 0, width: 480, height: 480 });
  });

  test("modelCropFor: 눈 좌표 있으면 aligned crop + 회전값", () => {
    const v_7d769d = {
      bounds: { x: 74, y: 301, width: 365, height: 366 },
      landmarks: { LEFT_EYE: { x: 196.5, y: 445.1 }, RIGHT_EYE: { x: 305.2, y: 455.7 } },
    };
    const { crop: v_d4a8ea, rotation: v_46d9bf, rollRad: v_b476a0, rollExpand: v_075d74 } = v_fa192b(v_7d769d, 640, 480, "landscape-left");
    expect(v_46d9bf).toBe("270deg");
    expect(v_d4a8ea.x + v_d4a8ea.width).toBeLessThanOrEqual(640);
    expect(v_d4a8ea.y + v_d4a8ea.height).toBeLessThanOrEqual(480);
    expect(v_b476a0).toBeCloseTo(v_12b919(v_7d769d.landmarks.LEFT_EYE, v_7d769d.landmarks.RIGHT_EYE), 5);
    expect(v_075d74).toBeGreaterThan(1);
  });

  test("modelCropFor: 눈 좌표 없으면 BB + margin(정사각형)", () => {
    const { crop: v_d4a8ea, rotation: v_46d9bf, rollRad: v_b476a0, rollExpand: v_075d74 } = v_fa192b(
      { bounds: { x: 100, y: 100, width: 100, height: 100 } },
      640,
      480,
      "portrait",
    );
    expect(v_46d9bf).toBe("0deg");
    expect(v_d4a8ea).toEqual({ x: 85, y: 85, width: 130, height: 130 });
    expect(v_b476a0).toBe(0);
    expect(v_075d74).toBe(1);
  });
});

describe("얼굴 crop — roll(고개 기울기) 정렬", () => {
  test("rollExpandFactor: 0°→1, 45°→√2", () => {
    expect(v_e24300(0)).toBeCloseTo(1, 5);
    expect(v_e24300(Math.PI / 4)).toBeCloseTo(Math.SQRT2, 5);
  });

  test("기운 눈이면 crop 이 수평 눈보다 크다", () => {
    const v_15168d = v_2c12f7({
      bounds: { x: 0, y: 0, width: 200, height: 200 },
      landmarks: { LEFT_EYE: { x: 80, y: 100 }, RIGHT_EYE: { x: 120, y: 100 } },
    });
    const v_735b20 = v_2c12f7({
      bounds: { x: 0, y: 0, width: 200, height: 200 },
      landmarks: { LEFT_EYE: { x: 80, y: 90 }, RIGHT_EYE: { x: 120, y: 110 } },
    });
    expect(v_15168d).not.toBeNull();
    expect(v_735b20).not.toBeNull();
    expect(v_735b20!.width).toBeGreaterThan(v_15168d!.width);
  });

  test("applyRollAlignFloat32: |roll| 작으면 입력 버퍼 그대로", () => {
    const v_38d084 = new Float32Array(112 * 112 * 3);
    v_38d084[0] = 0.5;
    expect(v_e2ddec(v_38d084, 112, 0, 1)).toBe(v_38d084);
    expect(v_e2ddec(v_38d084, 112, 0.01, 1.001)).toBe(v_38d084);
  });

  test("applyRollAlignFloat32: 중심 근처 샘플이 유한하고 길이 유지", () => {
    const v_05b441 = 112;
    const v_38d084 = new Float32Array(v_05b441 * v_05b441 * 3);
    for (let v_ebec57 = 0; v_ebec57 < v_38d084.length; v_ebec57++) v_38d084[v_ebec57] = (v_ebec57 % 3) * 0.2 + 0.1;
    const v_fc6de5 = Math.PI / 6;
    const v_46889d = v_e24300(v_fc6de5);
    const v_8d4337 = v_e2ddec(v_38d084, v_05b441, v_fc6de5, v_46889d);
    expect(v_8d4337).not.toBe(v_38d084);
    expect(v_8d4337.length).toBe(v_38d084.length);
    for (let v_ebec57 = 0; v_ebec57 < v_8d4337.length; v_ebec57++) expect(Number.isFinite(v_8d4337[v_ebec57]!)).toBe(true);
  });
});
