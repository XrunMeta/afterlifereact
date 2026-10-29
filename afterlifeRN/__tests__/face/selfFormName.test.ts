

import { v_6d7550 } from "../../src/face/selfFormName";

describe("initialSelfFormName", () => {
  it("계정 얼굴 일치(selfMode) → 계정 이름", () => {
    expect(v_6d7550(true, "히즈키")).toBe("히즈키");
  });
  it("계정 이름이 없으면 빈 값", () => {
    expect(v_6d7550(true, null)).toBe("");
    expect(v_6d7550(true, undefined)).toBe("");
  });
  it("스캔 등록(selfMode 아님)은 이름이 있어도 빈 값", () => {
    expect(v_6d7550(false, "히즈키")).toBe("");
  });
  it("앞뒤 공백은 지운다", () => {
    expect(v_6d7550(true, "  히즈키 ")).toBe("히즈키");
  });
});
