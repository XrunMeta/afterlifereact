import {
  v_47bc73,
  v_ad3760,
  v_5a3048,
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

describe("faceYawRatio — landmark 로 본 옆모습 정도", () => {
  test("정면(코가 두 눈 중점)이면 0", () =>
    expect(
      v_5a3048({ LEFT_EYE: { x: 40, y: 50 }, RIGHT_EYE: { x: 80, y: 50 }, NOSE_BASE: { x: 60, y: 70 } }),
    ).toBeCloseTo(0));

  test("|코 x − 눈 중점 x| / 두 눈 거리", () =>
    expect(
      v_5a3048({ LEFT_EYE: { x: 40, y: 50 }, RIGHT_EYE: { x: 80, y: 50 }, NOSE_BASE: { x: 76, y: 70 } }),
    ).toBeCloseTo(0.4));

  test("landmark 없으면 null", () => {
    expect(v_5a3048(null)).toBeNull();
    expect(v_5a3048(undefined)).toBeNull();
    expect(v_5a3048({ LEFT_EYE: { x: 40, y: 50 }, RIGHT_EYE: { x: 80, y: 50 } })).toBeNull();
  });

  test("두 눈이 겹치면(거리 0) null", () =>
    expect(
      v_5a3048({ LEFT_EYE: { x: 40, y: 50 }, RIGHT_EYE: { x: 40, y: 50 }, NOSE_BASE: { x: 60, y: 70 } }),
    ).toBeNull());
});

describe("classifyFaceQualityGuarded — 숫자가 아닌 입력은 그 판정만 건너뛴다", () => {
  test("NaN luma → 밝기 판정 생략(ok)", () =>
    expect(v_ad3760({ luma: NaN, faceWidthRatio: 0.3, yawRatio: 0 })).toBe("ok"));

  test("NaN luma 여도 작은 얼굴은 small", () =>
    expect(v_ad3760({ luma: NaN, faceWidthRatio: 0.05, yawRatio: 0 })).toBe("small"));

  test("Infinity 폭 비율 → 크기 판정 생략", () =>
    expect(v_ad3760({ luma: 0.5, faceWidthRatio: Infinity, yawRatio: 0 })).toBe("ok"));

  test("NaN yaw → 옆모습 판정 생략", () =>
    expect(v_ad3760({ luma: 0.5, faceWidthRatio: 0.3, yawRatio: NaN })).toBe("ok"));

  test("정상 입력은 classifyFaceQuality 와 같다", () =>
    expect(v_ad3760({ luma: 0.1, faceWidthRatio: 0.3, yawRatio: 0 })).toBe("dark"));
});
