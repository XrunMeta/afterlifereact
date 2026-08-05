

import { describe, it, expect, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";
import { issueToken } from "../src/lib/jwt";
import { __resetMemoryFaceIndex, getFaceIndex } from "../src/lib/faceVectors";
import { faceNamespace, enrollCloneScopeFaces } from "../src/lib/cloneFaceScope";

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(email)
    .run();
  const u = await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, cloneType = "memlow"): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

function vec(seed: number): number[] {
  const v = new Array(512).fill(0);
  v[seed % 512] = 1;
  return v;
}

async function issueAccessToken(userId: number): Promise<string> {
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function seedCloneFace(userId: number, cloneId: number, personId: number, vector: number[]) {
  const vectorizeId = crypto.randomUUID();
  await getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).insert([
    { id: vectorizeId, values: vector, namespace: faceNamespace(userId, cloneId), metadata: { personId: String(personId) } },
  ]);
  await db()
    .prepare(
      `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
       VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
    )
    .bind(cloneId, personId, vectorizeId, Date.now())
    .run();
}

describe("POST /oth-path — 클론 스코프", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("cloneId가 없으면 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("t257a@x.com");
    const token = await issueAccessToken(userId);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1) }),
    });

    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(userId).toBeGreaterThan(0);
  });

  it("클론 A에 등록한 얼굴이 클론 B에서는 매칭되지 않는다", async () => {
    const userId = await seedUser("t257b@x.com");
    const cloneA = await seedClone(userId, "t257b-a");
    const cloneB = await seedClone(userId, "t257b-b");
    const token = await issueAccessToken(userId);

    const createRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cloneId: cloneA, displayName: "지훈", enrolledVia: "card" }),
    });
    expect(createRes.status).toBe(201);
    const person = await createRes.json<{ id: number }>();
    const consentRes = await SELF.fetch(`https://x/oth-path${person.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: "granted" }),
    });
    expect(consentRes.status).toBe(200);
    await seedCloneFace(userId, cloneA, person.id, vec(1));

    const hitRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId: cloneA }),
    });
    expect(hitRes.status).toBe(200);
    const hit = await hitRes.json<{ best: { personId: number; displayName: string } | null }>();
    expect(hit.best?.personId).toBe(person.id);
    expect(hit.best?.displayName).toBe("지훈");

    const missRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId: cloneB }),
    });
    expect(missRes.status).toBe(200);
    const miss = await missRes.json<{ best: unknown | null; matches: unknown[] }>();
    expect(miss.best).toBeNull();
    expect(miss.matches).toHaveLength(0);
  });

  it("타 사용자 소유 공개 클론이어도 접근 가능(비소유자 매칭)", async () => {
    const ownerId = await seedUser("t257c-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257c-owner-clone");
    const otherId = await seedUser("t257c-other@x.com");
    const token = await issueAccessToken(otherId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ best: unknown | null; matches: unknown[] }>();
    expect(body.best).toBeNull();
    expect(body.matches).toHaveLength(0);
  });

  it("private 클론·비-follower는 여전히 404(접근 불가는 계속 차단)", async () => {
    const ownerId = await seedUser("t257priv-owner@x.com");
    await db()
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Private', 't257priv-clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(ownerId)
      .run();
    const cloneId = (
      await db().prepare("SELECT id FROM clones WHERE username = 't257priv-clone'").first<{ id: number }>()
    )!.id;
    const strangerId = await seedUser("t257priv-stranger@x.com");
    const token = await issueAccessToken(strangerId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(404);
  });

  it("정지된(admin_suspended_at) 공개 클론은 소유자가 아니면 여전히 404", async () => {
    const ownerId = await seedUser("t257susp-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257susp-clone");
    await db()
      .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(cloneId)
      .run();
    const strangerId = await seedUser("t257susp-stranger@x.com");
    const token = await issueAccessToken(strangerId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(404);
  });

  it("두 사용자가 같은 클론에 등록해도 서로 다른 person이고 서로 매칭되지 않는다", async () => {
    const ownerId = await seedUser("t257iso-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257iso-clone");
    const userA = await seedUser("t257iso-a@x.com");
    const userB = await seedUser("t257iso-b@x.com");
    const tokA = await issueAccessToken(userA);
    const tokB = await issueAccessToken(userB);

    const personA = await (
      await SELF.fetch("https://x/oth-path", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${tokA}` },
        body: JSON.stringify({ cloneId, displayName: "A화자", enrolledVia: "card" }),
      })
    ).json<{ id: number }>();
    await SELF.fetch(`https://x/oth-path${personA.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokA}` },
      body: JSON.stringify({ state: "granted" }),
    });
    await SELF.fetch(`https://x/oth-path${personA.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokA}` },
      body: JSON.stringify({ cloneId, vectors: [vec(30)] }),
    });

    const personB = await (
      await SELF.fetch("https://x/oth-path", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${tokB}` },
        body: JSON.stringify({ cloneId, displayName: "B화자", enrolledVia: "card" }),
      })
    ).json<{ id: number }>();
    await SELF.fetch(`https://x/oth-path${personB.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokB}` },
      body: JSON.stringify({ state: "granted" }),
    });

    await SELF.fetch(`https://x/oth-path${personB.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokB}` },
      body: JSON.stringify({ cloneId, vectors: [vec(30)] }),
    });

    expect(personA.id).not.toBe(personB.id);

    const resA = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokA}` },
      body: JSON.stringify({ vector: vec(30), cloneId }),
    });
    const bodyA = await resA.json<{ best: { personId: number } | null }>();
    expect(bodyA.best?.personId).toBe(personA.id);

    const resB = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokB}` },
      body: JSON.stringify({ vector: vec(30), cloneId }),
    });
    const bodyB = await resB.json<{ best: { personId: number } | null }>();
    expect(bodyB.best?.personId).toBe(personB.id);
  });

  it("소유자 본인이어도 소프트삭제된 클론이면 404(deletion_state≠active)", async () => {
    const userId = await seedUser("t257d@x.com");
    const cloneId = await seedClone(userId, "t257d-deleted");
    await db()
      .prepare(`UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(cloneId)
      .run();
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(404);
  });
});

describe("unknown → L2′ 생성 왕복", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("등록 직후 같은 벡터가 hit 되고 L2′ 초기 행이 생긴다", async () => {
    const userId = await seedUser("t257d@x.com");
    const cloneId = await seedClone(userId, "t257d-clone");
    const token = await issueAccessToken(userId);

    const beforeRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(9), cloneId }),
    });
    const before = await beforeRes.json<{ best: unknown | null }>();
    expect(before.best).toBeNull();

    const createRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cloneId, displayName: "민지", enrolledVia: "card" }),
    });
    const person = await createRes.json<{ id: number }>();
    await SELF.fetch(`https://x/oth-path${person.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: "granted" }),
    });
    const enrollRes = await SELF.fetch(`https://x/oth-path${person.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cloneId, vectors: [vec(9)] }),
    });
    expect(enrollRes.status).toBe(200);

    const cpf = await db()
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, person.id)
      .first<{ n: number }>();
    expect(cpf?.n).toBe(1);

    const l2p = await db()
      .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, person.id)
      .first<{ data: string }>();
    expect(l2p).not.toBeNull();

    const afterRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(9), cloneId }),
    });
    const after = await afterRes.json<{ best: { personId: number } | null }>();
    expect(after.best?.personId).toBe(person.id);
  });

  it("POST /oth-path 는 cloneId 없으면 422 VALIDATION_FAILED(브리프 400 정정)", async () => {
    await seedUser("t257e@x.com");
    const userId = await seedUser("t257e-2@x.com");
    const token = await issueAccessToken(userId);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ displayName: "누구" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("D1 이중 방어 — Vectorize엔 매치가 잡히지만 clone_person_faces가 다른 클론 소속이면 걸러진다", async () => {
    const userId = await seedUser("t257m@x.com");
    const cloneA = await seedClone(userId, "t257m-clone-a");
    const cloneB = await seedClone(userId, "t257m-clone-b");
    const token = await issueAccessToken(userId);

    const createRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cloneId: cloneA, displayName: "이중방어", enrolledVia: "card" }),
    });
    const person = await createRes.json<{ id: number }>();
    await SELF.fetch(`https://x/oth-path${person.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: "granted" }),
    });

    const vectorizeId = crypto.randomUUID();
    await getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).insert([
      {
        id: vectorizeId,
        values: vec(11),
        namespace: faceNamespace(userId, cloneB),
        metadata: { personId: String(person.id) },
      },
    ]);
    await db()
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
      )
      .bind(cloneA, person.id, vectorizeId, Date.now())
      .run();

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(11), cloneId: cloneB }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ best: unknown | null; matches: unknown[] }>();
    expect(body.best).toBeNull();
    expect(body.matches).toHaveLength(0);
  });
});

describe("enrollCloneScopeFaces — source 매핑(face_embeddings CHECK 어휘 축소)", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  async function seedGrantedPerson(userId: number, cloneId: number, name: string): Promise<number> {
    const now = Date.now();
    const ins = await db()
      .prepare(
        `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
         VALUES (?, ?, ?, 'granted', ?, 'card', ?)`,
      )
      .bind(userId, cloneId, name, now, now)
      .run();
    return ins.meta.last_row_id as number;
  }

  it("source:'self' → clone_person_faces엔 'self', face_embeddings엔 'enroll'로 좁혀 기록(둘 다 throw 없이 성공)", async () => {
    const userId = await seedUser("t257n@x.com");
    const cloneId = await seedClone(userId, "t257n-clone");
    const personId = await seedGrantedPerson(userId, cloneId, "셀프확정대상");

    const result = await enrollCloneScopeFaces(env as never, {
      userId,
      cloneId,
      personId,
      vectors: [vec(20)],
      source: "self",
    });
    expect(result.enrolled).toBe(1);

    const cpf = await db()
      .prepare("SELECT source FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first<{ source: string }>();
    expect(cpf?.source).toBe("self");

    const fe = await db()
      .prepare("SELECT source FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ source: string }>();
    expect(fe?.source).toBe("enroll");
  });

  it("source:'call'(기본값) → 두 장부 모두 'call'로 기록(회귀 확인)", async () => {
    const userId = await seedUser("t257o@x.com");
    const cloneId = await seedClone(userId, "t257o-clone");
    const personId = await seedGrantedPerson(userId, cloneId, "일반통화대상");

    const result = await enrollCloneScopeFaces(env as never, {
      userId,
      cloneId,
      personId,
      vectors: [vec(21)],

    });
    expect(result.enrolled).toBe(1);

    const cpf = await db()
      .prepare("SELECT source FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first<{ source: string }>();
    expect(cpf?.source).toBe("call");

    const fe = await db()
      .prepare("SELECT source FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ source: string }>();
    expect(fe?.source).toBe("call");
  });
});
