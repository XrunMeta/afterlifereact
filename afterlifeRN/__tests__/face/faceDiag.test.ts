import { formatFaceHud, FACE_DIAG_ENABLED } from "../../src/config/faceDiag";

describe("formatFaceHud", () => {
  it("HUD 문자열에 score·이름·streak·verdict·threshold 포함", () => {
    const s = formatFaceHud({
      score: 0.7123, personId: 5, displayName: "민지",
      streak: 2, verdict: "candidate", threshold: 0.83,
    });
    expect(s).toContain("0.712");
    expect(s).toContain("민지");
    expect(s).toContain("2/3");
    expect(s).toContain("candidate");
    expect(s).toContain("0.83");
  });
  it("이름 없으면 personId로 대체", () => {
    const s = formatFaceHud({ score: 0, personId: null, displayName: null, streak: 0, verdict: "none", threshold: 0.83 });
    expect(s).toContain("none");
  });
  it("이름 없고 personId 있으면 #personId로 대체(R1 보강)", () => {
    const s = formatFaceHud({ score: 0, personId: 5, displayName: null, streak: 0, verdict: "none", threshold: 0.83 });
    expect(s).toContain("#5");
  });
  it("FACE_DIAG_ENABLED는 boolean", () => {
    expect(typeof FACE_DIAG_ENABLED).toBe("boolean");
  });
});
