import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const SUPER_ADMIN_ID = 9002; 

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}

async function issueSuperAdminToken(): Promise<string> {
  return issueToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });
}

async function issueAdminToken(): Promise<string> {
  return issueToken({ sub: 99998, kind: "access", admin: true });
}

beforeAll(async () => {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(SUPER_ADMIN_ID, "superadmin-voices@afterlife.test", "hashed-placeholder")
    .run();
});

describe("admin /oth-path", () => {
  it("목록 조회 — admin 토큰으로 200", async () => {
    const token = await issueAdminToken();
    const res = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ voices: unknown[] }>();
    expect(Array.isArray(body.voices)).toBe(true);
  });

  it("생성·수정·비활성 — super_admin 토큰으로 201→200", async () => {
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const created = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ name: "테스트음색", sort_order: 5, r2_key: "voice/sample/test.mp3" }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: number }>();
    expect(typeof id).toBe("number");

    const upd = await SELF.fetch(`https://x/oth-path${id}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ is_active: 0, sort_order: 9 }),
    });
    expect(upd.status).toBe(200);
    const updBody = await upd.json<{ ok: boolean }>();
    expect(updBody.ok).toBe(true);
  });

  it("일반 유저(admin 클레임 없음) — 401 거부", async () => {
    const res = await SELF.fetch("https://x/oth-path");
    expect(res.status).toBe(401);
  });

  it("POST r2_key가 voice/ prefix 없으면 422", async () => {
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ name: "악의적음색", r2_key: "private/secret/key.mp3" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("PUT r2_key가 voice/ prefix 없으면 422", async () => {
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const created = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ name: "prefix테스트음색", r2_key: "voice/ok/test.mp3" }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: number }>();

    const res = await SELF.fetch(`https://x/oth-path${id}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ r2_key: "../sensitive/path.mp3" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("POST name 81자 초과 — 422", async () => {
    const token = await issueSuperAdminToken();
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(81) }),
    });
    expect(res.status).toBe(422);
  });

  it("POST + GET — 다국어 name 필드 왕복 저장", async () => {
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const created = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        name: "다국어테스트",
        name_en: "Multilang Test",
        name_ja: "多言語テスト",
        name_zh_cn: "多语言测试",
        name_id: "Uji Multibahasa",
        r2_key: "voice/sample/i18n.mp3",
      }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: number }>();

    const list = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await list.json<{
      voices: Array<{
        id: number;
        name: string;
        name_en: string | null;
        name_ja: string | null;
        name_zh_cn: string | null;
        name_id: string | null;
      }>;
    }>();
    const row = body.voices.find((v) => v.id === id);
    expect(row).toBeDefined();
    expect(row!.name_en).toBe("Multilang Test");
    expect(row!.name_ja).toBe("多言語テスト");
    expect(row!.name_zh_cn).toBe("多语言测试");
    expect(row!.name_id).toBe("Uji Multibahasa");
  });

  it("PUT — 다국어 name 부분 수정 및 null 로 clear", async () => {
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const created = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        name: "부분수정테스트",
        name_en: "Initial EN",
        r2_key: "voice/sample/partial.mp3",
      }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: number }>();

    const upd = await SELF.fetch(`https://x/oth-path${id}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ name_en: "Updated EN", name_ja: "追加JA" }),
    });
    expect(upd.status).toBe(200);

    const clr = await SELF.fetch(`https://x/oth-path${id}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ name_en: null }),
    });
    expect(clr.status).toBe(200);
  });
});
