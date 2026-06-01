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
