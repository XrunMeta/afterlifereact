import { decideEnrollSuggestAction, decideOrphanCleanupBeforeSilent } from "../../src/face/autoEnrollGuard";

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

describe("decideOrphanCleanupBeforeSilent", () => {
  it("잔여 없음(pendingId/enrolledId 둘 다 null) → none", () => {
    expect(
      decideOrphanCleanupBeforeSilent({
        enrolling: false,
        pendingPersonId: null,
        enrolledPersonId: null,
        incomingName: "B",
        lastName: "A",
      }),
    ).toBe("none");
  });

  it("카드 경로 error 잔여(pendingId 존재) + 다른 후보 → delete(서버 고아 person 정리)", () => {
    expect(
      decideOrphanCleanupBeforeSilent({
        enrolling: false,
        pendingPersonId: 101,
        enrolledPersonId: 101,
        incomingName: "B",
        lastName: "A",
      }),
    ).toBe("delete");
  });

  it("success~reset() 사이 레이스(enrolledId만 존재, pendingId null) + 다른 후보 → detach(삭제 없이 ref만 분리)", () => {
    expect(
      decideOrphanCleanupBeforeSilent({
        enrolling: false,
        pendingPersonId: null,
        enrolledPersonId: 301,
        incomingName: "B",
        lastName: "A",
      }),
    ).toBe("detach");
  });

  it("동일 후보 재제안(incomingName === lastName)이면 pendingId 있어도 none(재사용 유지)", () => {
    expect(
      decideOrphanCleanupBeforeSilent({
        enrolling: false,
        pendingPersonId: 101,
        enrolledPersonId: 101,
        incomingName: "A",
        lastName: "A",
      }),
    ).toBe("none");
  });

  it("enrolling 중이면 다른 후보라도 none(상위에서 이미 ignore 처리되므로 안전 폴백)", () => {
    expect(
      decideOrphanCleanupBeforeSilent({
        enrolling: true,
        pendingPersonId: 101,
        enrolledPersonId: 101,
        incomingName: "B",
        lastName: "A",
      }),
    ).toBe("none");
  });
});
