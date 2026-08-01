import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
function db(): D1Database {
  return env.DB as unknown as D1Database;
}

async function seedUser(): Promise<number> {
  seq += 1;
  const email = `sda-${seq}-${Date.now()}@test.local`;
  await db()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number, visibility = "public"): Promise<number> {
  seq += 1;
  const username = `sda_clone_${seq}`;
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, visibility)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function suspendClone(cloneId: number): Promise<void> {
  await db()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트 중지' WHERE id = ?`)
    .bind(cloneId)
    .run();
}

async function grantCoowner(cloneId: number, ownerId: number, targetUserId: number): Promise<void> {
  await db()
    .prepare(`INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`)
    .bind(cloneId, ownerId, targetUserId)
    .run();
}

async function grantCredits(userId: number, credits: number): Promise<void> {
  await db().prepare(`UPDATE users SET credits = ? WHERE id = ?`).bind(credits, userId).run();
}

async function token(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function auth(t: string): Record<string, string> {
  return { Authorization: `Bearer ${t}` };
}

describe("GET /oth-path — 직접 링크 상세", () => {
  it("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);
    const ot = await token(owner);
    const st = await token(stranger);

    expect((await SELF.fetch(`http://localhost/oth-path${suspended}`, { headers: auth(ot) })).status).toBe(200);
    expect((await SELF.fetch(`http://localhost/oth-path${suspended}`, { headers: auth(st) })).status).toBe(403);
    expect((await SELF.fetch(`http://localhost/oth-path${normal}`, { headers: auth(st) })).status).toBe(200);
  });

  it("coowner 도 정지 중 상세 조회 가능", async () => {
    const owner = await seedUser();
    const coowner = await seedUser();
    const suspended = await seedClone(owner, "private");
    await suspendClone(suspended);
    await grantCoowner(suspended, owner, coowner);
    const ct = await token(coowner);
    expect((await SELF.fetch(`http://localhost/oth-path${suspended}`, { headers: auth(ct) })).status).toBe(200);
  });
});

describe("PATCH /oth-path — 대화 기억 갱신", () => {
  async function patchL2(cloneId: number, t: string): Promise<Response> {
    return SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: "PATCH",
      headers: { ...auth(t), "Content-Type": "application/json" },
      body: JSON.stringify({ memory_summary: "테스트 요약" }),
    });
  }

  it("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);
    const ot = await token(owner);
    const st = await token(stranger);

    expect((await patchL2(suspended, ot)).status).toBe(200);
    expect((await patchL2(suspended, st)).status).toBe(403);
    expect((await patchL2(normal, st)).status).toBe(200);
  });
});

describe("GET /oth-path — 개별 피드 타임라인", () => {
  it("타인은 403, 소유자는 200, 정상 클론은 타인도 200", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);
    const ot = await token(owner);
    const st = await token(stranger);

    expect((await SELF.fetch(`http://localhost/oth-path${suspended}/oth-path`, { headers: auth(ot) })).status).toBe(200);
    expect((await SELF.fetch(`http://localhost/oth-path${suspended}/oth-path`, { headers: auth(st) })).status).toBe(403);
    expect((await SELF.fetch(`http://localhost/oth-path${normal}/oth-path`, { headers: auth(st) })).status).toBe(200);
  });
});

describe("POST /oth-path — 클론에게 DM", () => {
  async function send(cloneId: number, t: string, idemKey: string): Promise<Response> {
    return SELF.fetch(`http://localhost/oth-path${cloneId}/messages`, {
      method: "POST",
      headers: { ...auth(t), "Content-Type": "application/json", "X-Idempotency-Key": idemKey },
      body: JSON.stringify({ content: "안녕하세요" }),
    });
  }

  it("타인은 403(크레딧 무관하게 발신 자체 차단), 소유자는 200, 정상 클론은 타인도 200", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);
    await grantCredits(owner, 10);
    await grantCredits(stranger, 10);
    const ot = await token(owner);
    const st = await token(stranger);

    expect((await send(suspended, ot, "sda-msg-owner-1")).status).toBe(200);
    expect((await send(suspended, st, "sda-msg-stranger-1")).status).toBe(403);
    expect((await send(normal, st, "sda-msg-stranger-2")).status).toBe(200);
  });

  it("stream 변형도 타인 발신 차단", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    await suspendClone(suspended);
    const st = await token(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${suspended}/messages/stream`, {
      method: "POST",
      headers: { ...auth(st), "Content-Type": "application/json", "X-Idempotency-Key": "sda-stream-1" },
      body: JSON.stringify({ content: "안녕" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("POST /oth-path — 선물(결제)", () => {
  async function giftLogCount(cloneId: number, senderId: number): Promise<number> {
    const row = await db()
      .prepare(`SELECT COUNT(*) AS n FROM gift_logs WHERE clone_id = ? AND sender_user_id = ?`)
      .bind(cloneId, senderId)
      .first<{ n: number }>();
    return row?.n ?? 0;
  }

  it("타인이 정지 클론에 선물 시도 → 403 + gift_logs 행 생성 안 됨(결제 시작 전 차단)", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const suspended = await seedClone(owner);
    await suspendClone(suspended);
    await db().prepare(`UPDATE users SET xrun_member_id = 555001 WHERE id = ?`).bind(stranger).run();
    const st = await token(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${suspended}/gift`, {
      method: "POST",
      headers: { ...auth(st), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe("일시 중지된 페르소나에는 선물할 수 없어요.");
    expect(await giftLogCount(suspended, stranger)).toBe(0);
  });

  it("coowner 는 정지 게이트를 통과한다(그 이후 결제 단계에서 별도 사유로 실패해도 무관)", async () => {
    const owner = await seedUser();
    const coowner = await seedUser();
    const suspended = await seedClone(owner);
    await suspendClone(suspended);
    await grantCoowner(suspended, owner, coowner);
    await db().prepare(`UPDATE users SET xrun_member_id = 555002 WHERE id = ?`).bind(coowner).run();
    const ct = await token(coowner);

    const res = await SELF.fetch(`http://localhost/oth-path${suspended}/gift`, {
      method: "POST",
      headers: { ...auth(ct), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });

    expect(await giftLogCount(suspended, coowner)).toBe(1);
    if (res.status === 403) {
      const body = (await res.json()) as { error: { message: string } };
      expect(body.error.message).not.toBe("일시 중지된 페르소나에는 선물할 수 없어요.");
    }
  });

  it("정상(비정지) 클론은 타인의 선물 시도가 결제 단계까지 그대로 진행(회귀)", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const normal = await seedClone(owner);
    await db().prepare(`UPDATE users SET xrun_member_id = 555003 WHERE id = ?`).bind(stranger).run();
    const st = await token(stranger);

    await SELF.fetch(`http://localhost/oth-path${normal}/gift`, {
      method: "POST",
      headers: { ...auth(st), "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: "g1", giftName: "선물", amount: 10, pin: "123456" }),
    });
    expect(await giftLogCount(normal, stranger)).toBe(1);
  });
});

describe("GET /oth-path·shared·l2", () => {
  const paths = ["l1", "shared", "l2"];
  for (const p of paths) {
    it(`/${p} — 타인은 403, 소유자는 200, 정상 클론은 타인도 200`, async () => {
      const owner = await seedUser();
      const stranger = await seedUser();
      const suspended = await seedClone(owner);
      const normal = await seedClone(owner);
      await suspendClone(suspended);
      const ot = await token(owner);
      const st = await token(stranger);

      expect(
        (await SELF.fetch(`http://localhost/oth-path${suspended}/memory/${p}`, { headers: auth(ot) })).status,
      ).toBe(200);
      expect(
        (await SELF.fetch(`http://localhost/oth-path${suspended}/memory/${p}`, { headers: auth(st) })).status,
      ).toBe(403);
      expect(
        (await SELF.fetch(`http://localhost/oth-path${normal}/memory/${p}`, { headers: auth(st) })).status,
      ).toBe(200);
    });
  }
});
