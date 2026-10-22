import {
  v_47bc73,
  v_6722de,
  v_7e6cd4,
  v_300430,
  v_f50976,
} from "../../src/face/faceQuality";

describe("classifyFaceQuality — 화면 상태 판정 (우선순위 dark > small > turned > ok)", () => {
  test("dark when luma below DARK_LUMA", () =>
    expect(v_47bc73({ luma: 0.1, faceWidthRatio: 0.3, yawRatio: 0 })).toBe("dark"));

  test("small when face narrow", () =>
    expect(v_47bc73({ luma: 0.5, faceWidthRatio: 0.08, yawRatio: 0 })).toBe("small"));

  test("turned when yaw large", () =>
    expect(v_47bc73({ luma: 0.5, faceWidthRatio: 0.3, yawRatio: 0.5 })).toBe("turned"));

  test("yaw null skips turned", () =>
    expect(v_47bc73({ luma: 0.5, faceWidthRatio: 0.3, yawRatio: null })).toBe("ok"));

  test("dark wins over small", () =>
    expect(v_47bc73({ luma: 0.1, faceWidthRatio: 0.05, yawRatio: 0.9 })).toBe("dark"));

  test("small wins over turned", () =>
    expect(v_47bc73({ luma: 0.5, faceWidthRatio: 0.05, yawRatio: 0.9 })).toBe("small"));

  test("ok when all indicators are within range", () =>
    expect(v_47bc73({ luma: 0.5, faceWidthRatio: 0.3, yawRatio: 0.1 })).toBe("ok"));

  test("경계값: luma == DARK_LUMA, width == SMALL_FACE_RATIO, yaw == TURNED_YAW_RATIO 는 통과(ok)", () =>
    expect(
      v_47bc73({
        luma: v_7e6cd4,
        faceWidthRatio: v_300430,
        yawRatio: v_f50976,
      }),
    ).toBe("ok"));

  test("classifyFaceQuality 는 none 을 반환하지 않는다 (none 은 호출측이 얼굴 미검출 시 지정)", () => {
    const v_5b2623 = [
      { luma: 0, faceWidthRatio: 0, yawRatio: null },
      { luma: 1, faceWidthRatio: 1, yawRatio: 1 },
    ];
    for (const v_fd5f43 of v_5b2623) expect(v_47bc73(v_fd5f43)).not.toBe("none");
  });
});

describe("meanLuma — 0..1 RGB 인터리브 배열의 평균 휘도", () => {
  test("meanLuma of rgb", () => expect(v_6722de(new Float32Array([1, 1, 1, 0, 0, 0]))).toBeCloseTo(0.5));

  test("빈 배열은 0", () => expect(v_6722de(new Float32Array([]))).toBe(0));

  test("흰색 픽셀 하나는 1", () => expect(v_6722de(new Float32Array([1, 1, 1]))).toBeCloseTo(1));

  test("순수 빨강 한 픽셀은 0.299 (BT.601 가중치)", () =>
    expect(v_6722de(new Float32Array([1, 0, 0]))).toBeCloseTo(0.299));

  test("순수 초록 한 픽셀은 0.587", () =>
    expect(v_6722de(new Float32Array([0, 1, 0]))).toBeCloseTo(0.587));

  test("순수 파랑 한 픽셀은 0.114", () =>
    expect(v_6722de(new Float32Array([0, 0, 1]))).toBeCloseTo(0.114));
});
