import { decideEnrollSuggestAction } from "../../src/face/autoEnrollGuard";

describe("decideEnrollSuggestAction", () => {
  it("personId 없음 + enrolling 중 → ignore(연타 방지, 상위에서 이미 return하지만 안전망)", () => {
    expect(
      decideEnrollSuggestAction({ personId: undefined, faceBiometricConsent: true, autoEnrolledNoName: false, enrolling: true }),
    ).toEqual({ kind: "ignore" });
  });

  it("personId 없음 + 동의 O + enrolling 아님 → silent", () => {
    expect(
      decideEnrollSuggestAction({ personId: undefined, faceBiometricConsent: true, autoEnrolledNoName: false, enrolling: false }),
    ).toEqual({ kind: "silent" });
  });

  it("personId 없음 + 동의 X → card", () => {
    expect(
      decideEnrollSuggestAction({ personId: undefined, faceBiometricConsent: false, autoEnrolledNoName: false, enrolling: false }),
    ).toEqual({ kind: "card" });
  });

  it("personId 없음 + 동의 미확인(null, 조회 실패/진행중) → card(안전 폴백)", () => {
    expect(
      decideEnrollSuggestAction({ personId: undefined, faceBiometricConsent: null, autoEnrolledNoName: false, enrolling: false }),
    ).toEqual({ kind: "card" });
  });

  it("personId 있음 + 이번 통화 자동등록·무명 대상 → reflect_name", () => {
    expect(
      decideEnrollSuggestAction({ personId: 55, faceBiometricConsent: true, autoEnrolledNoName: true, enrolling: false }),
    ).toEqual({ kind: "reflect_name" });
  });

  it("personId 있음 + 대상 아님(자동등록 세트에 없음) → ignore", () => {
    expect(
      decideEnrollSuggestAction({ personId: 55, faceBiometricConsent: true, autoEnrolledNoName: false, enrolling: false }),
    ).toEqual({ kind: "ignore" });
  });

  it("personId 있음이면 enrolling/consent 값과 무관하게 personId 분기가 우선", () => {
    expect(
      decideEnrollSuggestAction({ personId: 7, faceBiometricConsent: false, autoEnrolledNoName: true, enrolling: true }),
    ).toEqual({ kind: "reflect_name" });
  });
});
