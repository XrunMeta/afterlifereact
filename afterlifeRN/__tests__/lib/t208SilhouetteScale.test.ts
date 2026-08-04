import {
  v_701c9e,
  v_a1a567,
  v_069313,
  v_6036cc,
  v_eab35e,
  v_8b5209,
} from "../../src/lib/t208SilhouetteScale";
import {
  v_2c25c5,
  v_e4c8b0,
  v_87a25c,
  v_951fee,
  v_890a60,
} from "../../src/lib/t208MeasureStore";

describe("T-208 measure helpers", () => {
  beforeEach(() => {
    v_eab35e(false);
    v_2c25c5();
  });

  it("제품 기본 배율은 0.50 (실측 모드 OFF)", () => {
    expect(v_701c9e).toBe(0.5);
    expect(v_069313()).toBe(0.5);
    expect(v_6036cc()).toBe(false);
  });

  it("실측 모드 ON 시 0.75부터·순환 0.75→0.50→0.40", () => {
    v_eab35e(true);
    expect(v_6036cc()).toBe(true);
    expect(v_069313()).toBe(0.75);
    expect(v_a1a567()).toBe(0.5);
    expect(v_a1a567()).toBe(0.4);
    expect(v_a1a567()).toBe(0.75);
    expect(v_8b5209(0.75)).toContain("0.75");
  });

  it("실측 모드 OFF 하면 다시 0.50", () => {
    v_eab35e(true);
    v_eab35e(false);
    expect(v_069313()).toBe(0.5);
  });

  it("크롭 3종 기록·완료 판정", () => {
    v_87a25c(0.75, "file://a");
    v_87a25c(0.5, "file://b");
    expect(v_951fee()).toBe(false);
    v_87a25c(0.4, "file://c");
    expect(v_951fee()).toBe(true);
    expect(v_e4c8b0()).toHaveLength(3);
    expect(v_890a60()).toContain("✓");
  });
});
