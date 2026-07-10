import { shouldShowFaceBiometricRetroPrompt } from "../../src/face/faceBiometricRetroPrompt";

describe("shouldShowFaceBiometricRetroPrompt", () => {
  it("version null(한 번도 안 물어봄) → true", () => {
    expect(shouldShowFaceBiometricRetroPrompt({ version: null })).toBe(true);
  });
  it("version 'v1'(이미 물어봄, 동의/거부 무관) → false", () => {
    expect(shouldShowFaceBiometricRetroPrompt({ version: "v1" })).toBe(false);
  });
  it("consent 자체가 null(조회 실패) → false(스팸 방지, 다음 진입에 재시도)", () => {
    expect(shouldShowFaceBiometricRetroPrompt(null)).toBe(false);
  });
});
