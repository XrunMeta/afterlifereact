import { v_d883e4 } from "../../src/screens/auth/faceBiometricSignupFlag";

describe("shouldSaveFaceBiometricOnSignup", () => {
  it("체크박스 true → true", () => {
    expect(v_d883e4(true)).toBe(true);
  });
  it("체크박스 false → false(저장 호출 자체를 안 함 — 미동의 상태 그대로, 별도 revoked POST 불필요)", () => {
    expect(v_d883e4(false)).toBe(false);
  });
});
