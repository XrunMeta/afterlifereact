import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const SUPER_ADMIN_ID = 9001; 

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}

async function issueSuperAdminToken(): Promise<string> {
  return issueToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });
}

async function issueRegularAdminToken(): Promise<string> {

  return issueToken({ sub: 99999, kind: "access", admin: true });
}

beforeAll(async () => {

  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(SUPER_ADMIN_ID, "superadmin-test@afterlife.test", "hashed-placeholder")
    .run();
});

describe("admin system-persona", () => {

  it("GET returns current L0 (regular admin token)", async () => {
    const tok = await issueRegularAdminToken();
    const res = await SELF.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ rules_text: string; blocklist: string[] }>();
    expect(typeof body.rules_text).toBe("string");
    expect(Array.isArray(body.blocklist)).toBe(true);
  });

  it("PUT updates rules_text and blocklist (super_admin token)", async () => {
    const tok = await issueSuperAdminToken();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "새 규칙입니다.", blocklist: ["욕설"] }),
    });
    expect(res.status).toBe(200);
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id=1")
      .first<{ rules_text: string; blocklist: string }>();
    expect(row!.rules_text).toBe("새 규칙입니다.");
    expect(JSON.parse(row!.blocklist)).toEqual(["욕설"]);
  });

  it("PUT rejects non-superadmin (regular admin token → 403)", async () => {
    const tok = await issueRegularAdminToken();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "침투 시도", blocklist: [] }),
    });

    expect([401, 403]).toContain(res.status);
  });

  it("PUT rejects rules_text over 8000 chars (super_admin token)", async () => {
    const tok = await issueSuperAdminToken();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "a".repeat(8001), blocklist: [] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("rules_text_too_long");
  });

  it("GET rejects missing token (no Authorization header → 401)", async () => {
    const res = await SELF.fetch("http://localhost/oth-path");
    expect(res.status).toBe(401);
  });
});
