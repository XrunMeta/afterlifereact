import { v_b4a89f, v_8ae2cb } from "../../src/face/ownerAutoEnroll";

const v_694b25 = { personCount: 0, ownerName: "지호", alreadyTried: false };

describe("shouldAutoEnrollOwner", () => {
  it("첫 얼굴 + 계정 이름 있음 → 확인 없이 등록한다", () => {
    expect(v_b4a89f(v_694b25)).toBe(true);
  });

  it("이미 등록된 화자가 있으면 자동 등록하지 않는다", () => {

    expect(v_b4a89f({ ...v_694b25, personCount: 1 })).toBe(false);
    expect(v_b4a89f({ ...v_694b25, personCount: 5 })).toBe(false);
  });

  it("계정 이름이 없으면 자동 등록하지 않는다", () => {

    for (const v_f4e98d of [null, undefined, "", "   "]) {
      expect(v_b4a89f({ ...v_694b25, ownerName: v_f4e98d })).toBe(false);
    }
  });

  it("통화당 한 번만 시도한다", () => {

    expect(v_b4a89f({ ...v_694b25, alreadyTried: true })).toBe(false);
  });

  it("alreadyTried 는 다른 조건보다 우선한다 — 실패 후에도 재시도하지 않는다", () => {
    expect(
      v_b4a89f({ personCount: 0, ownerName: "지호", alreadyTried: true }),
    ).toBe(false);
  });

  it("이름은 트림해서 쓴다", () => {
    expect(v_8ae2cb("  지호  ")).toBe("지호");
    expect(v_8ae2cb(null)).toBe("");
  });
});
