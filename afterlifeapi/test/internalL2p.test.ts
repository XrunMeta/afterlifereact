import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function seedPerson(userId: number, displayName: string | null = null): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const res = await db
    .prepare(`INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at) VALUES (?, NULL, ?, 'none', ?)`)
    .bind(userId, displayName, Date.now())
    .run();
  return res.meta.last_row_id as number;
}

async function seedCallSession(callId: string, userId: number, cloneId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)`)
    .bind(callId, userId, cloneId, Date.now())
    .run();
}

function learnSecret(): string {
  return (env as { LEARN_SECRET: string }).LEARN_SECRET;
}

describe("internal l2p (T-067 Task9)", () => {
  it("① POST learn(Bearer LEARN_SECRET) → clone_ont_person 행 생성·병합", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("l2p-learn@test.local");
    const cloneId = await seedClone(userId, "l2p-learn-clone");
    const personId = await seedPerson(userId);
    await seedCallSession("l2p-call-1", userId, cloneId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${learnSecret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        extracted: { relation: "이웃", memories_personal: ["같이 산책함"] },
        source: "call",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; skipped: boolean; rev: number };
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(false);
    expect(body.rev).toBe(1);

    const row = await db
      .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first<{ data: string }>();
    expect(row).not.toBeNull();
    const parsed = JSON.parse(row!.data) as { relation: string; memories_personal: string[] };
    expect(parsed.relation).toBe("이웃");
    expect(parsed.memories_personal).toContain("같이 산책함");
  });

  it("② GET l2p → data 반환 + displayName 조인", async () => {
    const userId = await seedUser("l2p-get@test.local");
    const cloneId = await seedClone(userId, "l2p-get-clone");
    const personId = await seedPerson(userId, "김철수");
    await seedCallSession("l2p-call-2", userId, cloneId);

    const learnRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${learnSecret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        extracted: { relation: "친구" },
        source: "call",
      }),
    });
    expect(learnRes.status).toBe(200);

    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}/l2p?personId=${personId}`,
      { headers: { Authorization: `Bearer ${learnSecret()}` } }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { relation: string } | null; displayName: string | null };
    expect(body.data).not.toBeNull();
    expect(body.data!.relation).toBe("친구");
    expect(body.displayName).toBe("김철수");
  });

  it("③ 없는 person(personId 브루트포스) → 404 (mizu CRITICAL: 존재 유추 차단, 오라클 없음)", async () => {
    const userId = await seedUser("l2p-missing@test.local");
    const cloneId = await seedClone(userId, "l2p-missing-clone");

    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}/l2p?personId=999999`,
      { headers: { Authorization: `Bearer ${learnSecret()}` } }
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { data?: unknown; displayName?: unknown };

    expect(body.data).toBeUndefined();
    expect(body.displayName).toBeUndefined();
  });

  it("GET l2p — person은 존재하나 이 clone과 통화 세션이 없는(비연관) 조합 → 404", async () => {
    const userId = await seedUser("l2p-unrelated@test.local");
    const otherUserId = await seedUser("l2p-unrelated-other@test.local");
    const cloneId = await seedClone(userId, "l2p-unrelated-clone");
    const otherCloneId = await seedClone(otherUserId, "l2p-unrelated-other-clone");
    const personId = await seedPerson(userId, "박영희");

    await seedCallSession("l2p-call-unrelated", userId, otherCloneId);

    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}/l2p?personId=${personId}`,
      { headers: { Authorization: `Bearer ${learnSecret()}` } }
    );
    expect(res.status).toBe(404);
  });

  it("④ 잘못된 시크릿 → 401 (GET·POST 둘 다)", async () => {
    const getRes = await SELF.fetch("http://localhost/oth-path?personId=1", {
      headers: { Authorization: "Bearer WRONG" },
    });
    expect(getRes.status).toBe(401);

    const postRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer WRONG", "Content-Type": "application/json" },
      body: JSON.stringify({ personId: 1, extracted: {}, source: "call" }),
    });
    expect(postRes.status).toBe(401);
  });

  it("learn — clone과 통화 세션 없는 personId → 403 no_interaction (call_turns 미의존, 리뷰 수정)", async () => {
    const userId = await seedUser("l2p-nointeract@test.local");
    const cloneId = await seedClone(userId, "l2p-nointeract-clone");
    const personId = await seedPerson(userId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${learnSecret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId, extracted: { relation: "친구" }, source: "call" }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("no_interaction");
  });

  it("learn — 빈 추출(no-op) → skipped:true, clone_ont_person 미기록", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("l2p-skip@test.local");
    const cloneId = await seedClone(userId, "l2p-skip-clone");
    const personId = await seedPerson(userId);
    await seedCallSession("l2p-call-skip", userId, cloneId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${learnSecret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId, extracted: {}, source: "call" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; skipped: boolean };
    expect(body.skipped).toBe(true);

    const row = await db
      .prepare("SELECT 1 FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first();
    expect(row).toBeNull();
  });

  it("learn — 기존 clone_ont(user_id 키) 경로는 무수정(회귀)", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("l2p-regression@test.local");
    const cloneId = await seedClone(userId, "l2p-regression-clone");
    await seedCallSession("l2-regression-call", userId, cloneId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/memory/l2/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${learnSecret()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, extracted: { relation: "가족" }, source: "call" }),
    });
    expect(res.status).toBe(200);

    const row = await db
      .prepare("SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(cloneId, userId)
      .first<{ data: string }>();
    expect(row).not.toBeNull();
  });
});
