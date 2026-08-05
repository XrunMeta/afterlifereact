import { describe, it, expect, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";
import { __resetMemoryFaceIndex } from "../src/lib/faceVectors";
import { issueToken } from "../src/lib/jwt";
import { confirmSelf } from "../src/lib/cloneFaceScope";
import { APIError } from "../src/lib/errors";
import type { Bindings } from "../src/lib/env";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1)`,
    )
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, cloneType = "memlow"): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

function vec(seed: number): number[] {
  const v = new Array(512).fill(0);
  v[seed % 512] = 1;
  return v;
}

async function login(email: string): Promise<string> {
  const db = env.DB as unknown as D1Database;
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: u!.id, kind: "access" }, secret, 60 * 10);
}

describe("POST /oth-path", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("3벡터 확정 시 clones.self_person_id 가 설정된다", async () => {
    const userId = await seedUser("t257f@x.com");
    const cloneId = await seedClone(userId, "t257f-clone");
    const token = await login("t257f@x.com");
    const db = env.DB as unknown as D1Database;

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(3), vec(3), vec(3)], displayName: "제작자" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ personId: number; selfPersonId: number }>();
    expect(body.personId).toBe(body.selfPersonId);

    const clone = await db
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(cloneId)
      .first<{ self_person_id: number | null }>();
    expect(clone?.self_person_id).toBe(body.personId);

    const cpf = await db
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ? AND source = 'self'")
      .bind(cloneId)
      .first<{ n: number }>();
    expect(cpf?.n).toBe(3);
  });

  it("이미 self가 확정된 클론은 409", async () => {
    const userId = await seedUser("t257g@x.com");
    const cloneId = await seedClone(userId, "t257g-clone");
    const token = await login("t257g@x.com");

    const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };
    await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify({ vectors: [vec(4), vec(4), vec(4)] }),
    });
    const second = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify({ vectors: [vec(5), vec(5), vec(5)] }),
    });
    expect(second.status).toBe(409);
  });

  it("전문가 클론은 422 — self 개념이 없다", async () => {
    const userId = await seedUser("t257h@x.com");
    const cloneId = await seedClone(userId, "t257h-clone", "expert");
    const token = await login("t257h@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(6), vec(6), vec(6)] }),
    });
    expect(res.status).toBe(422);
  });

  it("벡터가 3개가 아니면 422", async () => {
    const userId = await seedUser("t257i@x.com");
    const cloneId = await seedClone(userId, "t257i-clone");
    const token = await login("t257i@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(7), vec(7)] }),
    });
    expect(res.status).toBe(422);
  });

  it("타 사용자 소유 클론이면 404", async () => {
    const ownerId = await seedUser("t257j-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257j-owner-clone");
    await seedUser("t257j-other@x.com");
    const token = await login("t257j-other@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(8), vec(8), vec(8)] }),
    });
    expect(res.status).toBe(404);
  });

  it("소유자 본인이어도 소프트삭제된 클론이면 404(deletion_state≠active)", async () => {
    const userId = await seedUser("t257k@x.com");
    const cloneId = await seedClone(userId, "t257k-deleted");
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(`UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(cloneId)
      .run();
    const token = await login("t257k@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(9), vec(9), vec(9)] }),
    });
    expect(res.status).toBe(404);
  });
});

describe("confirmSelf() 경합 가드 — self_person_id UPDATE 영향행 0", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("경합 패자는 CONFLICT를 던지고 자신이 만든 person/벡터를 정리한다(고아 없음)", async () => {
    const userId = await seedUser("t257l@x.com");
    const cloneId = await seedClone(userId, "t257l-clone");
    const db = env.DB as unknown as D1Database;
    const bindings = env as unknown as Bindings;

    const winner = await confirmSelf(bindings, {
      userId,
      cloneId,
      vectors: [vec(10), vec(10), vec(10)],
      displayName: "승자",
    });

    let loserError: unknown = null;
    try {
      await confirmSelf(bindings, {
        userId,
        cloneId,
        vectors: [vec(11), vec(11), vec(11)],
        displayName: "패자",
      });
    } catch (e) {
      loserError = e;
    }
    expect(loserError).toBeInstanceOf(APIError);
    expect((loserError as APIError).code).toBe("CONFLICT");
    expect((loserError as APIError).status).toBe(409);

    const clone = await db
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(cloneId)
      .first<{ self_person_id: number | null }>();
    expect(clone?.self_person_id).toBe(winner.personId);

    const persons = await db
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?")
      .bind(cloneId)
      .first<{ n: number }>();
    expect(persons?.n).toBe(1);

    const cpf = await db
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ?")
      .bind(cloneId)
      .first<{ n: number }>();
    expect(cpf?.n).toBe(3);
  });
});

describe("confirmSelf() enroll 실패 → 고아 person 없음 + 재시도 성공", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("Vectorize insert 실패 시 person 행이 남지 않고, 동일 displayName 재시도는 200으로 성공한다", async () => {
    const userId = await seedUser("t257m@x.com");
    const cloneId = await seedClone(userId, "t257m-clone");
    const db = env.DB as unknown as D1Database;

    const failingIndex = {
      insert: async () => {
        throw new Error("simulated vectorize insert failure");
      },
      query: async () => ({ matches: [] }),
      deleteByIds: async () => {},
    } as unknown as VectorizeIndex;
    const failingBindings = new Proxy(env as unknown as Bindings, {
      get(target, prop, receiver) {
        if (prop === "FACE_VECTORS") return failingIndex;
        return Reflect.get(target, prop, receiver);
      },
    });

    await expect(
      confirmSelf(failingBindings, {
        userId,
        cloneId,
        vectors: [vec(12), vec(12), vec(12)],
        displayName: "재시도",
      }),
    ).rejects.toThrow();

    const persons = await db
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE clone_id = ?")
      .bind(cloneId)
      .first<{ n: number }>();
    expect(persons?.n).toBe(0);
    const clone = await db
      .prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(cloneId)
      .first<{ self_person_id: number | null }>();
    expect(clone?.self_person_id).toBeNull();

    const token = await login("t257m@x.com");
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/self-confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vectors: [vec(13), vec(13), vec(13)], displayName: "재시도" }),
    });
    expect(res.status).toBe(200);
  });
});
