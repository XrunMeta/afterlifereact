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

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () =>
  require("jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb"),
);

describe("T-208 measure helpers", () => {
  beforeEach(async () => {
    v_eab35e(false);
    await v_2c25c5();
  });

  it("제품 기본 배율은 0.95 — 프레임폭 기준 (실측 모드 OFF)", () => {
    expect(v_701c9e).toBe(0.95);
    expect(v_069313()).toBe(0.95);
    expect(v_6036cc()).toBe(false);
  });

  it("실측 모드 ON 시 0.95부터·순환 0.95→0.64→0.52", () => {
    v_eab35e(true);
    expect(v_6036cc()).toBe(true);
    expect(v_069313()).toBe(0.95);
    expect(v_a1a567()).toBe(0.64);
    expect(v_a1a567()).toBe(0.52);
    expect(v_a1a567()).toBe(0.95);
    expect(v_8b5209(0.95)).toContain("0.95");
  });

  it("실측 모드 OFF 하면 다시 0.95", () => {
    v_eab35e(true);
    v_eab35e(false);
    expect(v_069313()).toBe(0.95);
  });

  it("크롭 3종 기록·완료 판정", async () => {

    await v_87a25c(0.95, "file://a");
    await v_87a25c(0.64, "file://b");
    expect(v_951fee()).toBe(false);
    await v_87a25c(0.52, "file://c");
    expect(v_951fee()).toBe(true);
    expect(v_e4c8b0()).toHaveLength(3);
    expect(v_890a60()).toContain("✓");
  });
});
