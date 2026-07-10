import { v_d2929b } from "../../src/screens/auth/faceBiometricSignupFlag";

describe("faceBiometricSignupState", () => {
  it("체크박스 true → 'granted'", () => {
    expect(v_d2929b(true)).toBe("granted");
  });
  it("체크박스 false → 'revoked'(버전 기록을 위해 저장은 항상 호출, state 만 미동의로)", () => {
    expect(v_d2929b(false)).toBe("revoked");
  });
});
