

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_dbed3e, v_a8d2cc } from "../src/lib/faceVectors";
import { v_929ead } from "../src/lib/cloneFaceScope";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_3a8949 = "memlow"): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

function v_46ff7a(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0);
  v_81e2ef[v_bdb39e % 512] = 1;
  return v_81e2ef;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_a09be7(v_43e90c, v_6e0fd3, v_ca1ec5, v_f9a45c) {
  const v_f8758e = crypto.randomUUID();
  await v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).insert([
    { id: v_f8758e, values: v_f9a45c, namespace: v_929ead(v_43e90c, v_6e0fd3), metadata: { personId: String(v_ca1ec5) } },
  ]);
  await v_a1651b()
    .prepare(
      `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
       VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
    )
    .bind(v_6e0fd3, v_ca1ec5, v_f8758e, Date.now())
    .run();
}

v_469bf2("POST /oth-path — 클론 스코프", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("cloneId가 없으면 422 VALIDATION_FAILED", async () => {
    const v_43e90c = await v_bfb240("t257a@x.com");
    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1) }),
    });

    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = await v_8f00b9.json<{ error: { code: string } }>();
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
    v_4d37e3(v_43e90c).toBeGreaterThan(0);
  });

  v_23805a("클론 A에 등록한 얼굴이 클론 B에서는 매칭되지 않는다", async () => {
    const v_43e90c = await v_bfb240("t257b@x.com");
    const v_c521ce = await v_4d24a9(v_43e90c, "t257b-a");
    const v_65cfbc = await v_4d24a9(v_43e90c, "t257b-b");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_5d98f0 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ cloneId: v_c521ce, displayName: "지훈", enrolledVia: "card" }),
    });
    v_4d37e3(v_5d98f0.status).toBe(201);
    const v_306a28 = await v_5d98f0.json<{ id: number }>();
    const v_28ec91 = await v_1df298.fetch(`https://x/oth-path${v_306a28.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ state: "granted" }),
    });
    v_4d37e3(v_28ec91.status).toBe(200);
    await v_a09be7(v_43e90c, v_c521ce, v_306a28.id, v_46ff7a(1));

    const v_4f4e78 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_c521ce }),
    });
    v_4d37e3(v_4f4e78.status).toBe(200);
    const v_715950 = await v_4f4e78.json<{ best: { personId: number; displayName: string } | null }>();
    v_4d37e3(v_715950.best?.personId).toBe(v_306a28.id);
    v_4d37e3(v_715950.best?.displayName).toBe("지훈");

    const v_7ba086 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_65cfbc }),
    });
    v_4d37e3(v_7ba086.status).toBe(200);
    const v_90d74f = await v_7ba086.json<{ best: unknown | null; matches: unknown[] }>();
    v_4d37e3(v_90d74f.best).toBeNull();
    v_4d37e3(v_90d74f.matches).toHaveLength(0);
  });

  v_23805a("타 사용자 소유 클론이면 404", async () => {
    const v_1badb6 = await v_bfb240("t257c-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257c-owner-clone");
    const v_7a3219 = await v_bfb240("t257c-other@x.com");
    const v_21cc31 = await v_86c39f(v_7a3219);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("소유자 본인이어도 소프트삭제된 클론이면 404(deletion_state≠active)", async () => {
    const v_43e90c = await v_bfb240("t257d@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257d-deleted");
    await v_a1651b()
      .prepare(`UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });
});
