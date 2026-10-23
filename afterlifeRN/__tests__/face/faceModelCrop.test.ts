import { v_516b4f, v_fa192b, v_9871cb } from "../../src/face/faceAlignCrop";

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
    const { crop: v_d4a8ea, rotation: v_46d9bf } = v_fa192b(v_7d769d, 640, 480, "landscape-left");
    expect(v_46d9bf).toBe("270deg");
    expect(v_d4a8ea.x + v_d4a8ea.width).toBeLessThanOrEqual(640);
    expect(v_d4a8ea.y + v_d4a8ea.height).toBeLessThanOrEqual(480);
  });

  test("modelCropFor: 눈 좌표 없으면 BB + margin(정사각형)", () => {
    const { crop: v_d4a8ea, rotation: v_46d9bf } = v_fa192b({ bounds: { x: 100, y: 100, width: 100, height: 100 } }, 640, 480, "portrait");
    expect(v_46d9bf).toBe("0deg");
    expect(v_d4a8ea).toEqual({ x: 85, y: 85, width: 130, height: 130 });
  });
});
