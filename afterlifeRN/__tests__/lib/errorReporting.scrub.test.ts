import {
  scrubBreadcrumb,
  scrubErrorMessage,
  scrubString,
  scrubValue,
} from "../../src/lib/errorReporting/scrub";

describe("errorReporting scrub (T-220)", () => {
  it("Bearer / JWT / Authorization 문자열을 마스킹", () => {
    expect(scrubString("Authorization: Bearer abc.def.ghi")).toContain("[Redacted]");
    expect(
      scrubString("token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature_here_ok"),
    ).toContain("[Redacted]");
    expect(scrubString("access_token=secretvalue123")).toContain("[Redacted]");
  });

  it("민감 키 필드를 통째로 마스킹", () => {
    const scrubbed = scrubValue({
      userId: 9,
      accessToken: "super-secret",
      transcript: "안녕하세요 제 이름은",
      l2: { note: "개인 기억" },
      nested: { Authorization: "Bearer x", ok: true },
    }) as Record<string, unknown>;

    expect(scrubbed.userId).toBe(9);
    expect(scrubbed.accessToken).toBe("[Redacted]");
    expect(scrubbed.transcript).toBe("[Redacted]");
    expect(scrubbed.l2).toBe("[Redacted]");
    expect((scrubbed.nested as Record<string, unknown>).Authorization).toBe("[Redacted]");
    expect((scrubbed.nested as Record<string, unknown>).ok).toBe(true);
  });

  it("에러 메시지·브레드크럼도 스크럽", () => {
    expect(scrubErrorMessage("fail Bearer tokentokentoken")).toContain("[Redacted]");
    const bc = scrubBreadcrumb({
      category: "nav",
      message: "opened with access_token=abc",
      data: { password: "x", route: "Home" },
    });
    expect(bc.message).toContain("[Redacted]");
    expect(bc.data?.password).toBe("[Redacted]");
    expect(bc.data?.route).toBe("Home");
  });

  it("변형 키·이메일·휴대폰도 마스킹", () => {
    const scrubbed = scrubValue({
      authToken: "x",
      myTranscript: "발화",
      l2Data: { a: 1 },
      route: "Home",
    }) as Record<string, unknown>;
    expect(scrubbed.authToken).toBe("[Redacted]");
    expect(scrubbed.myTranscript).toBe("[Redacted]");
    expect(scrubbed.l2Data).toBe("[Redacted]");
    expect(scrubbed.route).toBe("Home");

    expect(scrubString("mail me at user@example.com please")).toContain("[Redacted]");
    expect(scrubString("call 010-1234-5678 now")).toContain("[Redacted]");
  });
});
