import {
  v_f7b672,
  v_34e478,
  v_4043e6 as v_fe37f7,
  v_00f5bb,
  v_413278,
} from "../../src/face/embeddingThrottle";

it("스로틀 간격 미만이면 false, 이상이면 true", () => {
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7 - 1)).toBe(false);
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7)).toBe(true);
});

it("경계 초과도 true", () => {
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7 + 500)).toBe(true);
});

it("lastRunMs가 0이고 nowMs가 스로틀 간격 이상이면 true", () => {
  expect(v_f7b672(0, v_fe37f7)).toBe(true);
});

describe("resolveThrottleMs — dev/릴리즈 분기", () => {
  it("dev 빌드는 3000ms", () => {
    expect(v_34e478(true)).toBe(3000);
    expect(v_34e478(true)).toBe(v_00f5bb);
  });

  it("릴리즈 빌드도 3000ms — dev 와 같다(2026-08-13 히즈키 지시 \"3초 1회\")", () => {

    expect(v_34e478(false)).toBe(3000);
    expect(v_34e478(false)).toBe(v_413278);
  });

  it("릴리즈 값은 T-120 사고값(2000)보다 반드시 크다", () => {

    expect(v_413278).toBeGreaterThan(2000);
    expect(v_00f5bb).toBeGreaterThan(2000);

    expect(v_00f5bb).toBeLessThanOrEqual(v_413278);
  });
});

it("shouldRunEmbedding 본문은 __DEV__/process 를 직접 참조하지 않는다(워클릿 안전)", () => {
  const v_38d084 = v_f7b672.toString();
  expect(v_38d084).not.toContain("__DEV__");
  expect(v_38d084).not.toContain("process.env");
});

it("모듈 상수 EMBEDDING_THROTTLE_MS 는 dev/릴리즈 둘 중 하나로 확정된다", () => {
  expect(Number.isFinite(v_fe37f7)).toBe(true);
  expect(v_fe37f7).toBeGreaterThan(0);

  expect(v_fe37f7).toBe(v_00f5bb);
});
