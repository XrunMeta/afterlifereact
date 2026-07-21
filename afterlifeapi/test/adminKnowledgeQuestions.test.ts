import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const SUPER_ADMIN_ID = 9002; 

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}
async function superAdminToken(): Promise<string> {
  return issueToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });
}

beforeAll(async () => {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(SUPER_ADMIN_ID, "superadmin-kq@afterlife.test", "hashed-placeholder")
    .run();
});

async function req(path: string, method: string, token: string, body?: unknown) {
  return SELF.fetch(`http://localhost/oth-path${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("admin knowledge-questions", () => {
  it("PUT then GET round-trips a valid schema", async () => {
    const token = await superAdminToken();
    const put = await req("knowledge-questions", "PUT", token, {
      questions: [{ key: "job", label: "직업은?" }],
    });
    expect(put.status).toBe(200);
    const get = await req("knowledge-questions", "GET", token);
    expect(get.status).toBe(200);
    const json = (await get.json()) as { questions: unknown[] };

    expect(json.questions).toEqual([
      { key: "job", label: "직업은?", slots: [{ key: "job_val", label: "직업은?" }] },
    ]);
  });

  it("PUT rejects invalid schema with 400", async () => {
    const token = await superAdminToken();
    const put = await req("knowledge-questions", "PUT", token, {
      questions: [{ key: "job" }], 
    });
    expect(put.status).toBe(400);
  });
});
