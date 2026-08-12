import { shouldAutoEnrollOwner, ownerEnrollName } from "../../src/face/ownerAutoEnroll";

const base = { personCount: 0, ownerName: "지호", alreadyTried: false };

describe("shouldAutoEnrollOwner", () => {
  it("첫 얼굴 + 계정 이름 있음 → 확인 없이 등록한다", () => {
    expect(shouldAutoEnrollOwner(base)).toBe(true);
  });

  it("이미 등록된 화자가 있으면 자동 등록하지 않는다", () => {

    expect(shouldAutoEnrollOwner({ ...base, personCount: 1 })).toBe(false);
    expect(shouldAutoEnrollOwner({ ...base, personCount: 5 })).toBe(false);
  });

  it("계정 이름이 없으면 자동 등록하지 않는다", () => {

    for (const n of [null, undefined, "", "   "]) {
      expect(shouldAutoEnrollOwner({ ...base, ownerName: n })).toBe(false);
    }
  });

  it("통화당 한 번만 시도한다", () => {

    expect(shouldAutoEnrollOwner({ ...base, alreadyTried: true })).toBe(false);
  });

  it("alreadyTried 는 다른 조건보다 우선한다 — 실패 후에도 재시도하지 않는다", () => {
    expect(
      shouldAutoEnrollOwner({ personCount: 0, ownerName: "지호", alreadyTried: true }),
    ).toBe(false);
  });

  it("이름은 트림해서 쓴다", () => {
    expect(ownerEnrollName("  지호  ")).toBe("지호");
    expect(ownerEnrollName(null)).toBe("");
  });
});
