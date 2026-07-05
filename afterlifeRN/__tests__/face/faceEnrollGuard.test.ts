import { shouldCleanupOrphanOnSuggest } from "../../src/face/faceEnrollGuard";

test("enrolling 중이면 항상 false(무시 — 상위에서 별도 처리)", () => {
  expect(
    shouldCleanupOrphanOnSuggest({
      enrolling: true,
      pendingPersonId: 1,
      incomingName: "철수",
      lastName: "민지",
    }),
  ).toBe(false);
});

test("pendingPersonId 없으면(idle/success) false", () => {
  expect(
    shouldCleanupOrphanOnSuggest({
      enrolling: false,
      pendingPersonId: null,
      incomingName: "철수",
      lastName: "민지",
    }),
  ).toBe(false);
});

test("pendingPersonId 있고 이름이 같으면(동일 인물 재제안) false", () => {
  expect(
    shouldCleanupOrphanOnSuggest({
      enrolling: false,
      pendingPersonId: 1,
      incomingName: "민지",
      lastName: "민지",
    }),
  ).toBe(false);
});

test("pendingPersonId 있고 이름이 다르면(다른 인물 제안) true — 정리 대상", () => {
  expect(
    shouldCleanupOrphanOnSuggest({
      enrolling: false,
      pendingPersonId: 1,
      incomingName: "철수",
      lastName: "민지",
    }),
  ).toBe(true);
});
