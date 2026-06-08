import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `ws-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function issueAccessToken(userId: number, admin = false): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access", admin }, secret, 600);
}

function adminWarn(targetId: number, adminToken: string, body?: object): Promise<Response> {
  return SELF.fetch(`http://localhost/oth-path${targetId}/warn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

function createClone(token: string, username: string): Promise<Response> {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `idem-${username}-${seq}`,
    },
    body: JSON.stringify({ name: "T", username }),
  });
}

async function getSuspendedUntil(userId: number): Promise<string | null> {
  const db = env.DB as unknown as D1Database;
  const r = await db.prepare("SELECT suspended_until AS s FROM users WHERE id = ?").bind(userId).first<{ s: string | null }>();
  return r?.s ?? null;
}

describe("경고(strike) + 비활성화 + 페르소나 생성 차단", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_warnings").first();
    } catch {
      throw new Error("D1 migrations not applied (0063).");
    }
  });

  it("경고 1·2회는 정지 안 됨, 3회째 정지 + suspendedUntil 설정", async () => {
    const target = await seedUser();
    const admin = await issueAccessToken(await seedUser(), true);

    const r1 = (await (await adminWarn(target, admin)).json()) as { warningCount: number; suspended: boolean };
    expect(r1.warningCount).toBe(1);
    expect(r1.suspended).toBe(false);

    const r2 = (await (await adminWarn(target, admin)).json()) as { warningCount: number; suspended: boolean };
    expect(r2.warningCount).toBe(2);
    expect(r2.suspended).toBe(false);

    const r3 = (await (await adminWarn(target, admin)).json()) as {
      warningCount: number;
      suspended: boolean;
      suspendedUntil: string | null;
    };
    expect(r3.warningCount).toBe(3);
    expect(r3.suspended).toBe(true);
    expect(r3.suspendedUntil).toBeTruthy();
    expect(await getSuspendedUntil(target)).toBeTruthy();
  });

  it("정지 안 된 유저는 페르소나 생성 가능", async () => {
    const u = await seedUser();
    const token = await issueAccessToken(u);
    const res = await createClone(token, `ws_ok_${seq}`);
    expect([200, 201]).toContain(res.status);
  });

  it("정지된 유저는 페르소나 생성 차단(403 FORBIDDEN), 구경(피드)은 가능", async () => {
    const target = await seedUser();
    const admin = await issueAccessToken(await seedUser(), true);
    for (let i = 0; i < 3; i++) await adminWarn(target, admin);
    expect(await getSuspendedUntil(target)).toBeTruthy();

    const token = await issueAccessToken(target);
    const create = await createClone(token, `ws_blocked_${seq}`);
    expect(create.status).toBe(403);
    const cj = (await create.json()) as { error: { code: string } };
    expect(cj.error.code).toBe("FORBIDDEN");

    const browse = await SELF.fetch("http://localhost/oth-path?limit=5");
    expect(browse.status).toBe(200);
  });

  it("신고 기각 → status dismissed", async () => {

    const reporter = await seedUser();
    const target = await seedUser();
    const repToken = await issueAccessToken(reporter);
    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const rep = await db
      .prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?")
      .bind(reporter, target)
      .first<{ id: number }>();
    const reportId = rep!.id;

    const admin = await issueAccessToken(await seedUser(), true);
    const res = await SELF.fetch(`http://localhost/oth-path${reportId}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin}` },
    });
    expect(res.status).toBe(200);

    const after = await db.prepare("SELECT status FROM user_reports WHERE id = ?").bind(reportId).first<{ status: string }>();
    expect(after?.status).toBe("dismissed");
  });
});
