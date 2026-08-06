import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { deletePersonCascade } from "../src/lib/personDelete";
import { getFaceIndex } from "../src/lib/faceVectors";
import { faceNamespace } from "../src/lib/cloneFaceScope";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedUser(email: string): Promise<number> {
  await E.DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(email).run();
  const u = await E.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  await E.DB.prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(ownerId, username).run();
  const c = await E.DB.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

function vec(fill = 0.1): number[] {
  return Array(512).fill(fill);
}

describe("deletePersonCascade (lib)", () => {
  it("face_embeddings/Vectorize/clone_ont_person 삭제 + persons 삭제 + call_turns NULL화 + 감사행 추가", async () => {
    const userId = await seedUser("lib-del-1@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "lib-del-1-clone");

    const createRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId }),
    });
    const { id: personId } = (await createRes.json()) as { id: number };

    await SELF.fetch(`http://localhost/oth-path${personId}/consent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });
    await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec(0.4)] }),
    });

    await E.DB.prepare(
      `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`,
    ).bind(cloneId + 100000, personId, Date.now()).run();

    const result = await deletePersonCascade(E, personId, userId);
    expect(result.deletedEmbeddings).toBe(1);

    const p = await E.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
    const fe = await E.DB.prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?").bind(personId).first<{ c: number }>();
    expect(fe?.c).toBe(0);
    const cop = await E.DB.prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?").bind(personId).first<{ c: number }>();
    expect(cop?.c).toBe(0);
    const logs = await E.DB.prepare(
      "SELECT state, channel FROM persons_consent_log WHERE person_id = ? ORDER BY id ASC",
    ).bind(personId).all<{ state: string; channel: string | null }>();
    expect(logs.results[logs.results.length - 1]).toMatchObject({ state: "revoked", channel: "face_delete" });

    const idx = getFaceIndex(E);
    const q = await idx.query(vec(0.4), { topK: 3, namespace: faceNamespace(userId, cloneId), returnMetadata: true });
    expect(q.matches.length).toBe(0);
  });

  it("self person을 삭제하면 clones.self_person_id가 NULL화된다", async () => {
    const userId = await seedUser("lib-del-self-1@test.local");
    const cloneId = await seedClone(userId, "lib-del-self-1-clone");
    const now = Date.now();
    const ins = await E.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, 'self', 'granted', ?, 'auto_biometric', ?)`,
    )
      .bind(userId, cloneId, now, now)
      .run();
    const personId = ins.meta.last_row_id as number;
    await E.DB.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(personId, cloneId).run();

    await deletePersonCascade(E, personId, userId);

    const clone = await E.DB.prepare("SELECT self_person_id FROM clones WHERE id = ?")
      .bind(cloneId)
      .first<{ self_person_id: number | null }>();
    expect(clone?.self_person_id).toBeNull();
  });

  it("clone_person_faces에만 있는 vectorize_id도 회수해 Vectorize에서 삭제한다", async () => {
    const userId = await seedUser("lib-del-cpf-1@test.local");
    const cloneId = await seedClone(userId, "lib-del-cpf-1-clone");
    const now = Date.now();
    const ins = await E.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, 'cpf전용', 'granted', ?, 'card', ?)`,
    )
      .bind(userId, cloneId, now, now)
      .run();
    const personId = ins.meta.last_row_id as number;

    const idx = getFaceIndex(E);
    const vectorizeId = crypto.randomUUID();
    await idx.insert([
      { id: vectorizeId, values: vec(0.7), namespace: faceNamespace(userId, cloneId), metadata: { personId: String(personId) } },
    ]);

    await E.DB.prepare(
      `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
       VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
    )
      .bind(cloneId, personId, vectorizeId, now)
      .run();

    const result = await deletePersonCascade(E, personId, userId);
    expect(result.deletedEmbeddings).toBe(1);

    const q = await idx.query(vec(0.7), { topK: 3, namespace: faceNamespace(userId, cloneId), returnMetadata: true });
    expect(q.matches.length).toBe(0);
  });

  it("임베딩 없는 person도 정상 삭제(deletedEmbeddings=0)", async () => {
    const userId = await seedUser("lib-del-2@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "lib-del-2-clone");
    const createRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId }),
    });
    const { id: personId } = (await createRes.json()) as { id: number };

    const result = await deletePersonCascade(E, personId, userId);
    expect(result.deletedEmbeddings).toBe(0);
    const p = await E.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
  });
});
