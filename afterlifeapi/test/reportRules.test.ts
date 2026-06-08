import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `rr-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function token(userId: number, admin = false): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
  return await issueToken({ sub: userId, kind: "access", admin }, secret, 600);
}

function adminReq(path: string, adminToken: string, method = "GET", body?: object): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function suspendedUntil(userId: number): Promise<string | null> {
  const db = env.DB as unknown as D1Database;
  const r = await db.prepare("SELECT suspended_until AS s FROM users WHERE id = ?").bind(userId).first<{ s: string | null }>();
  return r?.s ?? null;
}

describe("신고 누적 조건 — 설정 기반 벌칙", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM report_penalty_rules").first();
    } catch {
      throw new Error("D1 migrations not applied (0064).");
    }
  });

  it("GET 규칙 — 기본 시드(1·2 경고, 3 정지30) 반환", async () => {
    const admin = await token(await seedUser(), true);
    const res = await adminReq(`/oth-path`, admin);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { items: Array<{ threshold: number; action: string; suspendDays: number | null }> };
    const t3 = json.items.find((r) => r.threshold === 3);
    expect(t3?.action).toBe("suspend");
    expect(t3?.suspendDays).toBe(30);
  });

  it("규칙을 1회=7일 정지로 설정 → 첫 경고에 7일 정지 적용", async () => {
    const admin = await token(await seedUser(), true);

    const put = await adminReq(`/oth-path`, admin, "PUT", {
      action: "suspend",
      suspendDays: 7,
    });
    expect(put.status).toBe(200);

    const target = await seedUser();
    const warn = await adminReq(`/oth-path${target}/warn`, admin, "POST", {});
    expect(warn.status).toBe(200);
    const wj = (await warn.json()) as { warningCount: number; suspended: boolean; appliedSuspendDays: number | null };
    expect(wj.warningCount).toBe(1);
    expect(wj.suspended).toBe(true);
    expect(wj.appliedSuspendDays).toBe(7);
    expect(await suspendedUntil(target)).toBeTruthy();

    await adminReq(`/oth-path`, admin, "PUT", { action: "warn", suspendDays: null });
  });

  it("규칙 삭제 후 재조회 시 빠짐", async () => {
    const admin = await token(await seedUser(), true);
    await adminReq(`/oth-path`, admin, "PUT", { action: "warn", suspendDays: null });
    let res = await adminReq(`/oth-path`, admin);
    let json = (await res.json()) as { items: Array<{ threshold: number }> };
    expect(json.items.some((r) => r.threshold === 9)).toBe(true);

    const del = await adminReq(`/oth-path`, admin, "DELETE");
    expect(del.status).toBe(200);
    res = await adminReq(`/oth-path`, admin);
    json = (await res.json()) as { items: Array<{ threshold: number }> };
    expect(json.items.some((r) => r.threshold === 9)).toBe(false);
  });
});
