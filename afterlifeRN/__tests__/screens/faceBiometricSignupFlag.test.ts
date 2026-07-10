import { shouldSaveFaceBiometricOnSignup } from "../../src/screens/auth/faceBiometricSignupFlag";

describe("shouldSaveFaceBiometricOnSignup", () => {
  it("체크박스 true → true", () => {
    expect(shouldSaveFaceBiometricOnSignup(true)).toBe(true);
  });
  it("체크박스 false → false(저장 호출 자체를 안 함 — 미동의 상태 그대로, 별도 revoked POST 불필요)", () => {
    expect(shouldSaveFaceBiometricOnSignup(false)).toBe(false);
  });
});
