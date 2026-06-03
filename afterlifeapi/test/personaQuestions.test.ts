import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";
import { validatePersonaQuestions } from "../src/lib/personaQuestions";

describe("validatePersonaQuestions", () => {
  it("accepts a valid schema with gemma_choice + fixed_choice + showWhen", () => {
    const r = validatePersonaQuestions([
      { key: "tone", type: "gemma_choice", label: "말투?", targetField: "tone", options_include: ["사투리"] },
      { key: "dialect_region", type: "fixed_choice", label: "지역?", options: ["경상도"], showWhen: { tone: "사투리" } },
    ]);
    expect(r.ok).toBe(true);
  });

  it("rejects duplicate keys", () => {
    const r = validatePersonaQuestions([
      { key: "tone", type: "text", label: "a" },
      { key: "tone", type: "text", label: "b" },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("duplicate");
  });

  it("rejects unknown type", () => {
    const r = validatePersonaQuestions([{ key: "x", type: "slider", label: "a" }]);
    expect(r.ok).toBe(false);
  });

  it("rejects fixed_choice with empty options", () => {
    const r = validatePersonaQuestions([{ key: "x", type: "fixed_choice", label: "a", options: [] }]);
    expect(r.ok).toBe(false);
  });

  it("rejects showWhen referencing a non-existent key", () => {
    const r = validatePersonaQuestions([
      { key: "x", type: "text", label: "a", showWhen: { ghost: "v" } },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("showWhen");
  });

  it("rejects non-array input", () => {
    expect(validatePersonaQuestions({} as unknown).ok).toBe(false);
  });

  it("rejects more than 50 questions", () => {
    const qs = Array.from({ length: 51 }, (_, i) => ({ key: `k${i}`, type: "text", label: `L${i}` }));
    const r = validatePersonaQuestions(qs);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("too many");
  });

  it("rejects invalid key format (contains space)", () => {
    const r = validatePersonaQuestions([{ key: "bad key", type: "text", label: "a" }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("invalid key format");
  });

  it("rejects forbidden targetField (__proto__)", () => {
    const r = validatePersonaQuestions([{ key: "x", type: "text", label: "a", targetField: "__proto__" }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("forbidden targetField");
  });

  it("rejects forbidden targetField (attrs container key)", () => {
    const r = validatePersonaQuestions([{ key: "x", type: "text", label: "a", targetField: "attrs" }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("forbidden targetField");
  });

  it("rejects invalid targetField format (contains dot)", () => {
    const r = validatePersonaQuestions([{ key: "x", type: "text", label: "a", targetField: "a.b" }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("invalid targetField format");
  });

  it("rejects showWhen self-reference", () => {
    const r = validatePersonaQuestions([
      { key: "tone", type: "text", label: "a", showWhen: { tone: "v" } },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("self-reference");
  });

  it("rejects showWhen circular reference (A→B→A)", () => {
    const r = validatePersonaQuestions([
      { key: "a", type: "text", label: "A", showWhen: { b: "v" } },
      { key: "b", type: "text", label: "B", showWhen: { a: "v" } },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("circular");
  });

  it("rejects options > 20 for fixed_choice", () => {
    const opts = Array.from({ length: 21 }, (_, i) => `opt${i}`);
    const r = validatePersonaQuestions([{ key: "x", type: "fixed_choice", label: "a", options: opts }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("too many");
  });

  it("accepts valid targetField on a fixed_choice question", () => {
    const r = validatePersonaQuestions([
      { key: "tone", type: "fixed_choice", label: "말투?", targetField: "tone", options: ["반말", "존댓말"] },
    ]);
    expect(r.ok).toBe(true);
  });

  it("rejects fixed_choice with duplicate options", () => {
    const r = validatePersonaQuestions([
      { key: "mood", type: "fixed_choice", label: "분위기?", options: ["밝음", "조용함", "밝음"] },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("duplicate option");
    expect(r.error).toContain("mood");
  });

  it("rejects gemma_choice with duplicate options_include", () => {
    const r = validatePersonaQuestions([
      { key: "tone", type: "gemma_choice", label: "말투?", options_include: ["사투리", "반말", "사투리"] },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("duplicate options_include");
    expect(r.error).toContain("tone");
  });

  it("accepts fixed_choice with all unique options", () => {
    const r = validatePersonaQuestions([
      { key: "region", type: "fixed_choice", label: "지역?", options: ["서울", "부산", "제주"] },
    ]);
    expect(r.ok).toBe(true);
  });

  it("accepts v3 seed schema (10 questions) — all types/showWhen/targetField valid", () => {
    const v3Seed = [
      { key: "age", type: "fixed_choice", label: "나이대가 어떻게 되세요?", options: ["10대", "20대", "30대", "40대", "50대", "60대 이상"] },
      { key: "gender", type: "fixed_choice", label: "성별은요?", options: ["남성", "여성", "기타"] },
      { key: "mbti", type: "fixed_choice", label: "MBTI가 떠오르면 골라주세요", options: ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ", "모름"] },
      { key: "personality_core", type: "gemma_choice", label: "어떤 성격이셨나요?", targetField: "personality_core" },
      { key: "tone", type: "gemma_choice", label: "어떤 말투로 말하셨나요?", targetField: "tone", options_include: ["사투리"] },
      { key: "dialect_region", type: "fixed_choice", label: "어느 지역 사투리였나요?", options: ["경상도", "전라도", "충청도", "제주", "강원", "서울/경기"], showWhen: { tone: "사투리" } },
      { key: "dialect_intensity", type: "fixed_choice", label: "사투리가 어느 정도였나요?", options: ["약간", "보통", "심함"], showWhen: { tone: "사투리" } },
      { key: "first_meeting", type: "text", label: "처음 만난 이야기를 들려주실래요?" },
      { key: "habit", type: "text", label: "자주 하던 말이나 습관이 있었나요?" },
      { key: "memory", type: "text", label: "가장 선명한 추억 한 장면을 들려주세요" },
    ];
    const r = validatePersonaQuestions(v3Seed);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.questions).toHaveLength(10);

      const dialectRegion = r.questions.find((q) => q.key === "dialect_region");
      expect(dialectRegion?.showWhen).toEqual({ tone: "사투리" });

      const pc = r.questions.find((q) => q.key === "personality_core");
      expect(pc?.targetField).toBe("personality_core");

      const age = r.questions.find((q) => q.key === "age");
      expect(age?.targetField).toBeUndefined();
    }
  });
});

const SUPER_ADMIN_ID = 9001;

async function issueAdminToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken(extra, secret, 600);
}

async function superAdminTok(): Promise<string> {
  return issueAdminToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });
}

async function regularAdminTok(): Promise<string> {
  return issueAdminToken({ sub: 99998, kind: "access", admin: true });
}

beforeAll(async () => {

  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(SUPER_ADMIN_ID, "superadmin-pq-test@afterlife.test", "hashed-placeholder")
    .run();
});

describe("admin /persona-questions", () => {
  it("GET returns seeded schema", async () => {
    const tok = await regularAdminTok();
    const res = await SELF.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ questions: unknown[] }>();
    expect(Array.isArray(body.questions)).toBe(true);
  });

  it("PUT rejects invalid schema with 400", async () => {
    const tok = await superAdminTok();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "a", type: "slider", label: "x" }] }),
    });
    expect(res.status).toBe(400);
  });

  it("PUT persists a valid schema", async () => {
    const tok = await superAdminTok();
    const next = [{ key: "tone", type: "text", label: "말투?" }];
    const put = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: next }),
    });
    expect(put.status).toBe(200);
    const db = env.DB as unknown as D1Database;
    const row = await db.prepare("SELECT schema_json FROM persona_question_schema WHERE id=1").first<{ schema_json: string }>();
    expect(JSON.parse(row!.schema_json)[0].key).toBe("tone");
  });

  it("PUT rejects non-super_admin (regular admin token → 401 or 403)", async () => {
    const tok = await regularAdminTok();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "tone", type: "text", label: "a" }] }),
    });
    expect([401, 403]).toContain(res.status);
  });
});
