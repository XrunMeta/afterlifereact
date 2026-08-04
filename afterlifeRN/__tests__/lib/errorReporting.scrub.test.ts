import {
  v_c13d03,
  v_9effa0,
  v_6f333a,
  v_138422,
} from "../../src/lib/errorReporting/scrub";

describe("errorReporting scrub (T-220)", () => {
  it("Bearer / JWT / Authorization 문자열을 마스킹", () => {
    expect(v_6f333a("Authorization: Bearer abc.def.ghi")).toContain("[Redacted]");
    expect(
      v_6f333a("token oth-jwt"),
    ).toContain("[Redacted]");
    expect(v_6f333a("access_token=secretvalue123")).toContain("[Redacted]");
  });

  it("민감 키 필드를 통째로 마스킹", () => {
    const v_afc187 = v_138422({
      userId: 9,
      accessToken: "super-secret",
      transcript: "안녕하세요 제 이름은",
      l2: { note: "개인 기억" },
      nested: { Authorization: "Bearer x", ok: true },
    }) as Record<string, unknown>;

    expect(v_afc187.userId).toBe(9);
    expect(v_afc187.accessToken).toBe("[Redacted]");
    expect(v_afc187.transcript).toBe("[Redacted]");
    expect(v_afc187.l2).toBe("[Redacted]");
    expect((v_afc187.nested as Record<string, unknown>).Authorization).toBe("[Redacted]");
    expect((v_afc187.nested as Record<string, unknown>).ok).toBe(true);
  });

  it("에러 메시지·브레드크럼도 스크럽", () => {
    expect(v_9effa0("fail Bearer tokentokentoken")).toContain("[Redacted]");
    const v_19ac81 = v_c13d03({
      category: "nav",
      message: "opened with access_token=abc",
      data: { password: "x", route: "Home" },
    });
    expect(v_19ac81.message).toContain("[Redacted]");
    expect(v_19ac81.data?.password).toBe("[Redacted]");
    expect(v_19ac81.data?.route).toBe("Home");
  });

  it("변형 키·이메일·휴대폰도 마스킹", () => {
    const v_afc187 = v_138422({
      authToken: "x",
      myTranscript: "발화",
      l2Data: { a: 1 },
      route: "Home",
    }) as Record<string, unknown>;
    expect(v_afc187.authToken).toBe("[Redacted]");
    expect(v_afc187.myTranscript).toBe("[Redacted]");
    expect(v_afc187.l2Data).toBe("[Redacted]");
    expect(v_afc187.route).toBe("Home");

    expect(v_6f333a("mail me at user@example.com please")).toContain("[Redacted]");
    expect(v_6f333a("call 010-1234-5678 now")).toContain("[Redacted]");
  });
});
