import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { deletePersonCascade } from "../src/lib/personDelete";
import { getFaceIndex } from "../src/lib/faceVectors";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedUser(email: string): Promise<number> {
  await E.DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(email).run();
  const u = await E.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
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

    const createRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
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
      body: JSON.stringify({ vectors: [vec(0.4)] }),
    });
    await E.DB.prepare(
      `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (1, ?, '{}', ?)`,
    ).bind(personId, Date.now()).run();

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
    const q = await idx.query(vec(0.4), { topK: 3, namespace: String(userId), returnMetadata: true });
    expect(q.matches.length).toBe(0);
  });

  it("임베딩 없는 person도 정상 삭제(deletedEmbeddings=0)", async () => {
    const userId = await seedUser("lib-del-2@test.local");
    const tok = await issueAccessToken(userId);
    const createRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const { id: personId } = (await createRes.json()) as { id: number };

    const result = await deletePersonCascade(E, personId, userId);
    expect(result.deletedEmbeddings).toBe(0);
    const p = await E.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
  });
});
