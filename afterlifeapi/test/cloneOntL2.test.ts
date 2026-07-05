import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { loadUserL2 } from "../src/lib/personaBundle";
import { buildCallBundle } from "../src/lib/callBundle";
import { loadCloneById } from "../src/lib/cloneAccess";
import { issueToken } from "../src/lib/jwt";

const db = () => env.DB as unknown as D1Database;

describe("loadUserL2 (clone_ont)", () => {
  it("clone_ont.data에서 4필드만 추출, 사용자별 격리", async () => {

    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(
        9043,
        100,
        JSON.stringify({
          address: "성준",
          memories_personal: ["x"],
          memory_summary: "100의 기억",
          relationship: "친구",
        })
      )
      .run();

    const l2a = await loadUserL2(db(), 9043, 100);
    expect(l2a?.memory_summary).toBe("100의 기억");
    expect(l2a?.relationship).toBe("친구");

    expect((l2a as Record<string, unknown>)?.address).toBeUndefined();

    expect((l2a as Record<string, unknown>)?.memories_personal).toEqual(["x"]);

    const l2b = await loadUserL2(db(), 9043, 200);
    expect(l2b).toBeNull();
  });

  it("context, recent_topics 필드도 추출됨", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(
        9044,
        101,
        JSON.stringify({
          context: "첫 만남",
          recent_topics: ["날씨", "여행"],
          address: "이름",
        })
      )
      .run();

    const l2 = await loadUserL2(db(), 9044, 101);
    expect(l2?.context).toBe("첫 만남");
    expect(l2?.recent_topics).toEqual(["날씨", "여행"]);
    expect((l2 as Record<string, unknown>)?.address).toBeUndefined();
  });

  it("buildCallBundle이 요청 사용자의 clone_ont L2를 주입", async () => {

    await db()
      .prepare(
        "INSERT INTO clones (id, owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 1, 'TestClone', 'testclone9043', 'memlow', 'public', 1, CURRENT_TIMESTAMP)"
      )
      .bind(9043)
      .run();

    await db()
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9043, 100, JSON.stringify({ memory_summary: "100의 기억" }))
      .run();
    await db()
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9043, 200, JSON.stringify({ memory_summary: "200의 기억" }))
      .run();
    const clone = await loadCloneById(db(), 9043);
    const b100 = await buildCallBundle(db(), clone!, 100, "http://test");
    const b200 = await buildCallBundle(db(), clone!, 200, "http://test");
    expect(b100.personaBundle.persona.memory_summary).toBe("100의 기억");
    expect(b200.personaBundle.persona.memory_summary).toBe("200의 기억");
  });

  it("L2 소비 필드(구 4필드+학습 3키)가 모두 없으면 null 반환", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())"
      )
      .bind(9045, 102, JSON.stringify({ address: "홍길동", memories_personal: [] }))
      .run();

    const l2 = await loadUserL2(db(), 9045, 102);
    expect(l2).toBeNull();
  });

  it("data가 빈 문자열이면 null 반환", async () => {
    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, '', unixepoch())"
      )
      .bind(9046, 103)
      .run();

    const l2 = await loadUserL2(db(), 9046, 103);
    expect(l2).toBeNull();
  });
});

describe("PUT /oth-path — 통화 L2 4필드 보존", () => {
  async function seedUser(email: string): Promise<number> {
    await db()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)"
      )
      .bind(email)
      .run();
    return (
      await db()
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(email)
        .first<{ id: number }>()
    )!.id;
  }

  async function seedClone(ownerId: number, username: string): Promise<number> {
    await db()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'TC', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)"
      )
      .bind(ownerId, username, ownerId)
      .run();
    return (
      await db()
        .prepare("SELECT id FROM clones WHERE username = ?")
        .bind(username)
        .first<{ id: number }>()
    )!.id;
  }

  async function issueAccessToken(userId: number): Promise<string> {
    const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
    return issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
  }

  function authHeader(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `test-put-l2-${Date.now()}-${Math.random()}`,
    };
  }

  it("memory.ts PUT(채팅 편집)이 우리 4필드를 보존한다", async () => {
    const userAId = await seedUser("put-l2-preserve@test.local");
    const cloneId = await seedClone(userAId, "put_l2_preserve_c");
    const tokenA = await issueAccessToken(userAId);

    await db()
      .prepare(
        "INSERT INTO clone_ont (clone_id,user_id,data,updated_at) VALUES (?,?,?,unixepoch())"
      )
      .bind(cloneId, userAId, JSON.stringify({ memory_summary: "기존 기억" }))
      .run();

    const r = await SELF.fetch(
      `http://localhost/oth-path${cloneId}/memory/l2`,
      {
        method: "PUT",
        headers: authHeader(tokenA),
        body: JSON.stringify({ address: "오빠" }),
      }
    );
    expect(r.status).toBe(200);

    const row = await db()
      .prepare(
        "SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?"
      )
      .bind(cloneId, userAId)
      .first<{ data: string }>();
    const data = JSON.parse(row!.data) as Record<string, unknown>;
    expect(data.address).toBe("오빠");
    expect(data.memory_summary).toBe("기존 기억"); 
  });
});
