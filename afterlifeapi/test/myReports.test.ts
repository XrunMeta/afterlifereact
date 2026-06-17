import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `mr-${seq}-${(seq * 7919) % 100000}@test.local`;
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

function req(path: string, t: string, method = "GET", body?: object): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("내 신고 — made / received", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_reports").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("신고 접수 → made 에 대기중, 관리자 수락 → made 수락됨 + received 노출", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const reporterTok = await token(reporter);

    expect((await req(`/oth-path${target}/report`, reporterTok, "POST", { reason: "스팸" })).status).toBe(200);

    let made = (await (await req(`/oth-path`, reporterTok)).json()) as {
      items: Array<{ status: string; targetId: number; reason: string | null }>;
    };
    const mine = made.items.find((x) => x.targetId === target);
    expect(mine).toBeTruthy();
    expect(mine!.status).toBe("open");

    const targetTok = await token(target);
    let recv = (await (await req(`/oth-path`, targetTok)).json()) as {
      items: Array<{ adminMessage: string | null }>;
      warningCount: number;
    };
    expect(recv.items.length).toBe(0);

    const reportId = (
      (await (await req(`/oth-path`, reporterTok)).json()) as { items: Array<{ id: number; targetId: number }> }
    ).items.find((x) => x.targetId === target)!.id;
    const admin = await token(await seedUser(), true);
    const ADMIN_MSG = "신고가 확인되어 경고합니다.";
    expect(
      (await req(`/oth-path${target}/warn`, admin, "POST", { reportId, reason: ADMIN_MSG })).status,
    ).toBe(200);

    made = (await (await req(`/oth-path`, reporterTok)).json()) as {
      items: Array<{ status: string; targetId: number; adminMessage: string | null }>;
    };
    const m2 = made.items.find((x) => x.targetId === target)!;
    expect(m2.status).toBe("actioned");
    expect(m2.adminMessage).toBe(ADMIN_MSG);

    recv = (await (await req(`/oth-path`, targetTok)).json()) as {
      items: Array<{ adminMessage: string | null }>;
      warningCount: number;
    };
    expect(recv.items.length).toBe(1);
    expect(recv.warningCount).toBe(1);
    expect(recv.items[0].adminMessage).toBe(ADMIN_MSG);
  });
});
