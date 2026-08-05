import { describe, it, expect, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";
import { __resetMemoryFaceIndex } from "../src/lib/faceVectors";
import { hashPassword } from "../src/lib/password";

const PW = "Testpw1234";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const hash = await hashPassword(PW);
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, ?, 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(email, hash)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function seedPersonWithL2p(userId: number, cloneId: number, name: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const now = Date.now();
  const ins = await db
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'granted', ?)`,
    )
    .bind(userId, cloneId, name, now)
    .run();
  const personId = ins.meta.last_row_id as number;
  await db
    .prepare(
      `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', unixepoch())`,
    )
    .bind(cloneId, personId)
    .run();
  return personId;
}

async function login(email: string): Promise<string> {
  const res = await SELF.fetch("https://x/oth-path", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await res.json<{ accessToken: string }>();
  return j.accessToken;
}

describe("나를 기억하는 클론", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("L2′가 있는 클론이 목록에 나온다", async () => {
    const userId = await seedUser("t257m@x.com");
    const cloneId = await seedClone(userId, "t257m-clone");
    await seedPersonWithL2p(userId, cloneId, "나");
    const token = await login("t257m@x.com");

    const res = await SELF.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await res.json<{ clones: { cloneId: number }[] }>();
    expect(body.clones.map((x) => x.cloneId)).toContain(cloneId);
  });

  it("self L2′는 목록에서 제외된다", async () => {
    const userId = await seedUser("t257n@x.com");
    const cloneId = await seedClone(userId, "t257n-clone");
    const selfPersonId = await seedPersonWithL2p(userId, cloneId, "제작자");
    const db = env.DB as unknown as D1Database;
    await db.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(selfPersonId, cloneId).run();
    const token = await login("t257n@x.com");

    const res = await SELF.fetch("https://x/oth-path", {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await res.json<{ clones: { cloneId: number }[] }>();
    expect(body.clones.map((x) => x.cloneId)).not.toContain(cloneId);
  });

  it("지우기는 L2′와 person을 함께 삭제한다", async () => {
    const userId = await seedUser("t257o@x.com");
    const cloneId = await seedClone(userId, "t257o-clone");
    const personId = await seedPersonWithL2p(userId, cloneId, "지울사람");
    const token = await login("t257o@x.com");
    const db = env.DB as unknown as D1Database;

    const res = await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);

    const l2p = await db
      .prepare("SELECT COUNT(*) AS n FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first<{ n: number }>();
    expect(l2p?.n).toBe(0);

    const person = await db
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE id = ?")
      .bind(personId)
      .first<{ n: number }>();
    expect(person?.n).toBe(0);
  });

  it("존재하지 않는 cloneId를 지워도 에러 없이 0건을 반환한다(멱등)", async () => {
    const userId = await seedUser("t257p@x.com");
    const token = await login("t257p@x.com");

    const res = await SELF.fetch("https://x/oth-path", {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ deletedPersons: number; deletedVectors: number }>();
    expect(body.deletedPersons).toBe(0);
    expect(body.deletedVectors).toBe(0);
  });

  it("잘못된 cloneId는 422를 반환한다", async () => {
    const userId = await seedUser("t257q@x.com");
    const token = await login("t257q@x.com");

    const res = await SELF.fetch("https://x/oth-path", {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(422);
  });

  it("같은 클론을 두 번 지워도 에러 없이 멱등하다", async () => {
    const userId = await seedUser("t257r@x.com");
    const cloneId = await seedClone(userId, "t257r-clone");
    await seedPersonWithL2p(userId, cloneId, "지울사람2");
    const token = await login("t257r@x.com");

    const first = await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.status).toBe(200);

    const second = await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.status).toBe(200);
    const body = await second.json<{ deletedPersons: number; deletedVectors: number }>();
    expect(body.deletedPersons).toBe(0);
  });
});
