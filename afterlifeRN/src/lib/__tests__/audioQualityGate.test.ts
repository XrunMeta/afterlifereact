import { v_e7c7a4, v_44adb0 } from "../audioQualityGate";

describe("isClipping", () => {
  it("한계 근처(0 dBFS 부근)만 클리핑", () => {
    expect(v_44adb0(0)).toBe(true);
    expect(v_44adb0(v_e7c7a4)).toBe(true);
    expect(v_44adb0(-0.5)).toBe(true);
  });

  it("평범한 말소리·쉬는 구간·무음은 클리핑 아님", () => {
    expect(v_44adb0(-6)).toBe(false);
    expect(v_44adb0(-25)).toBe(false);
    expect(v_44adb0(-60)).toBe(false);
    expect(v_44adb0(-160)).toBe(false);
  });

  it("숫자가 아니면 아님", () => {
    expect(v_44adb0(Number.NaN)).toBe(false);
    expect(v_44adb0(Number.NEGATIVE_INFINITY)).toBe(false);
    expect(v_44adb0(undefined)).toBe(false);
  });
});
