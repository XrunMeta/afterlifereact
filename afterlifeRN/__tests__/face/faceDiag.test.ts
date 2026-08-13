import { v_3451db } from "../../src/face/speakerIdReducer";
import { v_8682a9, v_55dbc4 } from "../../src/config/faceDiag";

describe("formatFaceHud", () => {
  it("HUD 문자열에 score·이름·streak·verdict·threshold 포함", () => {
    const v_fd5f43 = v_8682a9({
      score: 0.7123, personId: 5, displayName: "민지",
      streak: 2, verdict: "candidate", threshold: 0.83,
    });
    expect(v_fd5f43).toContain("0.712");
    expect(v_fd5f43).toContain("민지");
    expect(v_fd5f43).toContain(`2/${v_3451db}`);
    expect(v_fd5f43).toContain("candidate");
    expect(v_fd5f43).toContain("0.83");
  });
  it("이름 없으면 personId로 대체", () => {
    const v_fd5f43 = v_8682a9({ score: 0, personId: null, displayName: null, streak: 0, verdict: "none", threshold: 0.83 });
    expect(v_fd5f43).toContain("none");
  });
  it("이름 없고 personId 있으면 #personId로 대체(R1 보강)", () => {
    const v_fd5f43 = v_8682a9({ score: 0, personId: 5, displayName: null, streak: 0, verdict: "none", threshold: 0.83 });
    expect(v_fd5f43).toContain("#5");
  });
  it("FACE_DIAG_ENABLED는 boolean", () => {
    expect(typeof v_55dbc4).toBe("boolean");
  });
  it("Fix 1 — verdict='unknown'(미상 확정)도 정상 렌더", () => {
    const v_fd5f43 = v_8682a9({ score: 0.5, personId: null, displayName: null, streak: 3, verdict: "unknown", threshold: 0.83 });
    expect(v_fd5f43).toContain("unknown");
  });
});
