import { v_17fa33 } from "../analyzeReason";

describe("analyzeReasonMessageKey", () => {
  it("TOO_SHORT → tooShort", () => {
    expect(v_17fa33("TOO_SHORT")).toBe("create.voice.analyzeFailTooShort");
  });
  it("NO_PAUSE → noPause", () => {
    expect(v_17fa33("NO_PAUSE")).toBe("create.voice.analyzeFailNoPause");
  });
  it("NO_VOICE → noVoice", () => {
    expect(v_17fa33("NO_VOICE")).toBe("create.voice.analyzeFailNoVoice");
  });
  it("ANALYZE_FAILED → generic", () => {
    expect(v_17fa33("ANALYZE_FAILED")).toBe("create.voice.analyzeFailGeneric");
  });
  it("프로토타입 체인 이름 → generic", () => {
    expect(v_17fa33("constructor")).toBe("create.voice.analyzeFailGeneric");
    expect(v_17fa33("toString")).toBe("create.voice.analyzeFailGeneric");
  });
  it("미지 reason → generic (Review Focus)", () => {
    expect(v_17fa33("SOMETHING_NEW")).toBe("create.voice.analyzeFailGeneric");
    expect(v_17fa33(undefined)).toBe("create.voice.analyzeFailGeneric");
  });
});
