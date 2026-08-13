import {
  shouldRunEmbedding,
  resolveThrottleMs,
  EMBEDDING_THROTTLE_MS as T,
  EMBEDDING_THROTTLE_DEV_MS,
  EMBEDDING_THROTTLE_RELEASE_MS,
} from "../../src/face/embeddingThrottle";

it("스로틀 간격 미만이면 false, 이상이면 true", () => {
  expect(shouldRunEmbedding(T, T + T - 1)).toBe(false);
  expect(shouldRunEmbedding(T, T + T)).toBe(true);
});

it("경계 초과도 true", () => {
  expect(shouldRunEmbedding(T, T + T + 500)).toBe(true);
});

it("lastRunMs가 0이고 nowMs가 스로틀 간격 이상이면 true", () => {
  expect(shouldRunEmbedding(0, T)).toBe(true);
});

describe("resolveThrottleMs — dev/릴리즈 분기", () => {
  it("dev 빌드는 3000ms", () => {
    expect(resolveThrottleMs(true)).toBe(3000);
    expect(resolveThrottleMs(true)).toBe(EMBEDDING_THROTTLE_DEV_MS);
  });

  it("릴리즈 빌드도 3000ms — dev 와 같다(2026-08-13 히즈키 지시 \"3초 1회\")", () => {

    expect(resolveThrottleMs(false)).toBe(3000);
    expect(resolveThrottleMs(false)).toBe(EMBEDDING_THROTTLE_RELEASE_MS);
  });

  it("릴리즈 값은 T-120 사고값(2000)보다 반드시 크다", () => {

    expect(EMBEDDING_THROTTLE_RELEASE_MS).toBeGreaterThan(2000);
    expect(EMBEDDING_THROTTLE_DEV_MS).toBeGreaterThan(2000);

    expect(EMBEDDING_THROTTLE_DEV_MS).toBeLessThanOrEqual(EMBEDDING_THROTTLE_RELEASE_MS);
  });

  it("env 오버라이드가 dev/릴리즈 기본값보다 우선한다", () => {
    expect(resolveThrottleMs(true, "5000")).toBe(5000);
    expect(resolveThrottleMs(false, "5000")).toBe(5000);
  });

  it("잘못된 env 값(빈문자·비숫자·0·음수)은 무시하고 기본값 폴백 — 0 스로틀은 매 프레임 tflite 추론", () => {
    for (const bad of ["", "abc", "0", "-1", "NaN"]) {
      expect(resolveThrottleMs(true, bad)).toBe(EMBEDDING_THROTTLE_DEV_MS);
      expect(resolveThrottleMs(false, bad)).toBe(EMBEDDING_THROTTLE_RELEASE_MS);
    }
    expect(resolveThrottleMs(false, null)).toBe(EMBEDDING_THROTTLE_RELEASE_MS);
    expect(resolveThrottleMs(false, undefined)).toBe(EMBEDDING_THROTTLE_RELEASE_MS);
  });
});

it("shouldRunEmbedding 본문은 __DEV__/process 를 직접 참조하지 않는다(워클릿 안전)", () => {
  const src = shouldRunEmbedding.toString();
  expect(src).not.toContain("__DEV__");
  expect(src).not.toContain("process.env");
});

it("모듈 상수 EMBEDDING_THROTTLE_MS 는 dev/릴리즈 둘 중 하나(또는 env 오버라이드)로 확정된다", () => {
  expect(Number.isFinite(T)).toBe(true);
  expect(T).toBeGreaterThan(0);

  if (!process.env.EXPO_PUBLIC_FACE_THROTTLE_MS) {
    expect(T).toBe(EMBEDDING_THROTTLE_DEV_MS);
  }
});
