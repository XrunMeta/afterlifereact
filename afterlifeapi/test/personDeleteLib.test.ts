import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_430d2b } from "../src/lib/personDelete";
import { v_a8d2cc } from "../src/lib/faceVectors";
import { v_929ead } from "../src/lib/cloneFaceScope";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_9542f7.DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_e0c7e8).run();
  const v_ceb55a = await v_9542f7.DB.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_9542f7.DB.prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(v_1badb6, v_556427).run();
  const v_3f4e2e = await v_9542f7.DB.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

function v_46ff7a(v_4a1c36 = 0.1): number[] {
  return Array(512).fill(v_4a1c36);
}

v_469bf2("deletePersonCascade (lib)", () => {
  v_23805a("face_embeddings/Vectorize/clone_ont_person 삭제 + persons 삭제 + call_turns NULL화 + 감사행 추가", async () => {
    const v_43e90c = await v_bfb240("lib-del-1@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "lib-del-1-clone");

    const v_5d98f0 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId: v_6e0fd3 }),
    });
    const { id: v_ca1ec5 } = (await v_5d98f0.json()) as { id: number };

    await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/consent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });
    await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_46ff7a(0.4)] }),
    });

    await v_9542f7.DB.prepare(
      `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`,
    ).bind(v_6e0fd3 + 100000, v_ca1ec5, Date.now()).run();

    const v_43c42e = await v_430d2b(v_9542f7, v_ca1ec5, v_43e90c);
    v_4d37e3(v_43c42e.deletedEmbeddings).toBe(1);

    const v_e2a85c = await v_9542f7.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_e2a85c?.c).toBe(0);
    const v_ac752c = await v_9542f7.DB.prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_ac752c?.c).toBe(0);
    const v_af3d78 = await v_9542f7.DB.prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_af3d78?.c).toBe(0);
    const v_056206 = await v_9542f7.DB.prepare(
      "SELECT state, channel FROM persons_consent_log WHERE person_id = ? ORDER BY id ASC",
    ).bind(v_ca1ec5).all<{ state: string; channel: string | null }>();
    v_4d37e3(v_056206.results[v_056206.results.length - 1]).toMatchObject({ state: "revoked", channel: "face_delete" });

    const v_e86ad8 = v_a8d2cc(v_9542f7);
    const v_ab6401 = await v_e86ad8.query(v_46ff7a(0.4), { topK: 3, namespace: v_929ead(v_43e90c, v_6e0fd3), returnMetadata: true });
    v_4d37e3(v_ab6401.matches.length).toBe(0);
  });

  v_23805a("임베딩 없는 person도 정상 삭제(deletedEmbeddings=0)", async () => {
    const v_43e90c = await v_bfb240("lib-del-2@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "lib-del-2-clone");
    const v_5d98f0 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId: v_6e0fd3 }),
    });
    const { id: v_ca1ec5 } = (await v_5d98f0.json()) as { id: number };

    const v_43c42e = await v_430d2b(v_9542f7, v_ca1ec5, v_43e90c);
    v_4d37e3(v_43c42e.deletedEmbeddings).toBe(0);
    const v_e2a85c = await v_9542f7.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_e2a85c?.c).toBe(0);
  });
});
