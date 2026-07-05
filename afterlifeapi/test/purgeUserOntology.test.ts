import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { purgeUserOntology, writeOnt, readOnt, writeOntPerson, readOntPerson } from "../src/lib/memoryStore";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedUser(id: number): Promise<void> {
  await E.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(id, `purge${id}@test.test`).run();
}
async function seedClone(cloneId: number, ownerId: number): Promise<void> {
  await E.DB.prepare(
    `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(cloneId, ownerId, `pc${cloneId}`).run();
}
async function seedPerson(personId: number, userId: number, cloneId: number): Promise<void> {
  await E.DB.prepare(
    `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
     VALUES (?, ?, ?, 'P', unixepoch())`,
  ).bind(personId, userId, cloneId).run();
}

describe("purgeUserOntology", () => {
  it("해당 user의 clone_ont(전 클론)·KV_ONT를 하드 파기", async () => {
    await seedUser(7701); await seedClone(9701, 7701); await seedClone(9702, 7701);
    await writeOnt(E, 9701, 7701, JSON.stringify({ relation: "손녀" }), true);
    await writeOnt(E, 9702, 7701, JSON.stringify({ relation: "친구" }), true);
    await seedUser(7799); await writeOnt(E, 9701, 7799, JSON.stringify({ relation: "이웃" }), true);

    const res = await purgeUserOntology(E, 7701);
    expect(res.ontRows).toBe(2);
    expect(res.kvKeys).toBe(2);
    expect(await readOnt(E, 9701, 7701)).toBeNull();
    expect(await readOnt(E, 9702, 7701)).toBeNull();
    expect(await E.KV_ONT.get("l2:9701:7701")).toBeNull();
    expect(await readOnt(E, 9701, 7799)).not.toBeNull(); 
  });

  it("해당 user가 등록한 person의 clone_ont_person 파기", async () => {
    await seedUser(7702); await seedClone(9703, 7702); await seedPerson(6601, 7702, 9703);
    await writeOntPerson(E, 9703, 6601, JSON.stringify({ relation: "이웃" }), true);
    const res = await purgeUserOntology(E, 7702);
    expect(res.personRows).toBe(1);
    expect(await readOntPerson(E, 9703, 6601)).toBeNull();
  });

  it("데이터 없는 user는 0건(멱등·throw 없음)", async () => {
    await seedUser(7703);
    const res = await purgeUserOntology(E, 7703);
    expect(res).toEqual({ ontRows: 0, personRows: 0, kvKeys: 0 });
  });
});

describe("삭제 경로 통합", () => {
  async function seedUserWithPw(email: string, pw: string): Promise<{ id: number; token: string }> {
    const { hashPassword } = await import("../src/lib/password");
    await E.DB.prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
    ).bind(email, await hashPassword(pw)).run();
    const u = await E.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email)
      .first<{ id: number }>();
    const loginRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    const token = (await loginRes.json<{ accessToken: string }>()).accessToken;
    return { id: u!.id, token };
  }

  it("DELETE /oth-path 후 clone_ont 잔존 0", async () => {
    const { id, token } = await seedUserWithPw("delme_ont@test.test", "Passw0rd!!");
    await E.DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (9751, ?, 'CT', 'pcm751', 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(id).run();
    await writeOnt(E, 9751, id, JSON.stringify({ relation: "손녀" }), true);

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await readOnt(E, 9751, id)).toBeNull();
  });

  it("POST /oth-path 후 clone_ont 잔존 0", async () => {
    const { id, token } = await seedUserWithPw("delme_gdpr@test.test", "Passw0rd!!");
    await E.DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (9752, ?, 'CT', 'pcm752', 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(id).run();
    await writeOnt(E, 9752, id, JSON.stringify({ relation: "친구" }), true);

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(200);
    expect(await readOnt(E, 9752, id)).toBeNull();
  });
});
