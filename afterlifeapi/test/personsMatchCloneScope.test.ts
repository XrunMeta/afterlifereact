

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_dbed3e, v_a8d2cc } from "../src/lib/faceVectors";
import { v_929ead, v_003ee1 } from "../src/lib/cloneFaceScope";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent, face_biometric_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1, 1)`,
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

    const v_c05df3 = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?").bind(v_43e90c, v_65cfbc).first<{ n: number }>();
    v_4d37e3(v_c05df3?.n).toBe(0);
    const v_90e63e = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ?").bind(v_65cfbc).first<{ n: number }>();
    v_4d37e3(v_90e63e?.n).toBe(0);
  });

  v_23805a("타 사용자 소유 공개 클론이어도 접근 가능(비소유자 매칭)", async () => {
    const v_1badb6 = await v_bfb240("t257c-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257c-owner-clone");
    const v_7a3219 = await v_bfb240("t257c-other@x.com");
    const v_21cc31 = await v_86c39f(v_7a3219);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ best: unknown | null; matches: unknown[] }>();
    v_4d37e3(v_4d33b2.best).toBeNull();
    v_4d37e3(v_4d33b2.matches).toHaveLength(0);
  });

  v_23805a("private 클론·비-follower는 여전히 404(접근 불가는 계속 차단)", async () => {
    const v_1badb6 = await v_bfb240("t257priv-owner@x.com");
    await v_a1651b()
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Private', 't257priv-clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(v_1badb6)
      .run();
    const v_6e0fd3 = (
      await v_a1651b().prepare("SELECT id FROM clones WHERE username = 't257priv-clone'").first<{ id: number }>()
    )!.id;
    const v_0b00e8 = await v_bfb240("t257priv-stranger@x.com");
    const v_21cc31 = await v_86c39f(v_0b00e8);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("정지된(admin_suspended_at) 공개 클론은 소유자가 아니면 여전히 404", async () => {
    const v_1badb6 = await v_bfb240("t257susp-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257susp-clone");
    await v_a1651b()
      .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(v_6e0fd3)
      .run();
    const v_0b00e8 = await v_bfb240("t257susp-stranger@x.com");
    const v_21cc31 = await v_86c39f(v_0b00e8);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(1), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("두 사용자가 같은 클론에 등록해도 서로 다른 person이고 서로 매칭되지 않는다", async () => {
    const v_1badb6 = await v_bfb240("t257iso-owner@x.com");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "t257iso-clone");
    const v_40efc8 = await v_bfb240("t257iso-a@x.com");
    const v_4a3fe3 = await v_bfb240("t257iso-b@x.com");
    const v_21b3f7 = await v_86c39f(v_40efc8);
    const v_fef5a7 = await v_86c39f(v_4a3fe3);

    const v_34af88 = await (
      await v_1df298.fetch("https://x/oth-path", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${v_21b3f7}` },
        body: JSON.stringify({ cloneId: v_6e0fd3, displayName: "A화자", enrolledVia: "card" }),
      })
    ).json<{ id: number }>();
    await v_1df298.fetch(`https://x/oth-path${v_34af88.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21b3f7}` },
      body: JSON.stringify({ state: "granted" }),
    });
    await v_1df298.fetch(`https://x/oth-path${v_34af88.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21b3f7}` },
      body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_46ff7a(30)] }),
    });

    const v_b57ac3 = await (
      await v_1df298.fetch("https://x/oth-path", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${v_fef5a7}` },
        body: JSON.stringify({ cloneId: v_6e0fd3, displayName: "B화자", enrolledVia: "card" }),
      })
    ).json<{ id: number }>();
    await v_1df298.fetch(`https://x/oth-path${v_b57ac3.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_fef5a7}` },
      body: JSON.stringify({ state: "granted" }),
    });

    await v_1df298.fetch(`https://x/oth-path${v_b57ac3.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_fef5a7}` },
      body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_46ff7a(30)] }),
    });

    v_4d37e3(v_34af88.id).not.toBe(v_b57ac3.id);

    const v_f6fab1 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21b3f7}` },
      body: JSON.stringify({ vector: v_46ff7a(30), cloneId: v_6e0fd3 }),
    });
    const v_4e954e = await v_f6fab1.json<{ best: { personId: number } | null }>();
    v_4d37e3(v_4e954e.best?.personId).toBe(v_34af88.id);

    const v_63149c = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_fef5a7}` },
      body: JSON.stringify({ vector: v_46ff7a(30), cloneId: v_6e0fd3 }),
    });
    const v_0bfd68 = await v_63149c.json<{ best: { personId: number } | null }>();
    v_4d37e3(v_0bfd68.best?.personId).toBe(v_b57ac3.id);
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

v_469bf2("unknown → L2′ 생성 왕복", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  v_23805a("등록 직후 같은 벡터가 hit 되고 L2′ 초기 행이 생긴다", async () => {
    const v_43e90c = await v_bfb240("t257d@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257d-clone");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_702bb5 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(9), cloneId: v_6e0fd3 }),
    });
    const v_e98932 = await v_702bb5.json<{ best: unknown | null }>();
    v_4d37e3(v_e98932.best).toBeNull();

    const v_5d98f0 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ cloneId: v_6e0fd3, displayName: "민지", enrolledVia: "card" }),
    });
    const v_306a28 = await v_5d98f0.json<{ id: number }>();
    await v_1df298.fetch(`https://x/oth-path${v_306a28.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ state: "granted" }),
    });
    const v_cdd22f = await v_1df298.fetch(`https://x/oth-path${v_306a28.id}/faces`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ cloneId: v_6e0fd3, vectors: [v_46ff7a(9)] }),
    });
    v_4d37e3(v_cdd22f.status).toBe(200);

    const v_550b91 = await v_a1651b()
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_306a28.id)
      .first<{ n: number }>();
    v_4d37e3(v_550b91?.n).toBe(1);

    const v_d94e57 = await v_a1651b()
      .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_306a28.id)
      .first<{ data: string }>();
    v_4d37e3(v_d94e57).not.toBeNull();

    const v_4cfad4 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(9), cloneId: v_6e0fd3 }),
    });
    const v_33efc5 = await v_4cfad4.json<{ best: { personId: number } | null }>();
    v_4d37e3(v_33efc5.best?.personId).toBe(v_306a28.id);
  });

  v_23805a("POST /oth-path 는 cloneId 없으면 422 VALIDATION_FAILED(브리프 400 정정)", async () => {
    await v_bfb240("t257e@x.com");
    const v_43e90c = await v_bfb240("t257e-2@x.com");
    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ displayName: "누구" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = await v_8f00b9.json<{ error: { code: string } }>();
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });

  v_23805a("D1 이중 방어 — Vectorize엔 매치가 잡히지만 clone_person_faces가 다른 클론 소속이면 걸러진다", async () => {
    const v_43e90c = await v_bfb240("t257m@x.com");
    const v_c521ce = await v_4d24a9(v_43e90c, "t257m-clone-a");
    const v_65cfbc = await v_4d24a9(v_43e90c, "t257m-clone-b");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_5d98f0 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ cloneId: v_c521ce, displayName: "이중방어", enrolledVia: "card" }),
    });
    const v_306a28 = await v_5d98f0.json<{ id: number }>();
    await v_1df298.fetch(`https://x/oth-path${v_306a28.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ state: "granted" }),
    });

    const v_f8758e = crypto.randomUUID();
    await v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).insert([
      {
        id: v_f8758e,
        values: v_46ff7a(11),
        namespace: v_929ead(v_43e90c, v_65cfbc),
        metadata: { personId: String(v_306a28.id) },
      },
    ]);
    await v_a1651b()
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
      )
      .bind(v_c521ce, v_306a28.id, v_f8758e, Date.now())
      .run();

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_46ff7a(11), cloneId: v_65cfbc }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ best: unknown | null; matches: unknown[] }>();
    v_4d37e3(v_4d33b2.best).toBeNull();
    v_4d37e3(v_4d33b2.matches).toHaveLength(0);
  });
});

v_469bf2("enrollCloneScopeFaces — source 매핑(face_embeddings CHECK 어휘 축소)", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  async function v_b18d0e(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
    const v_5c2f9f = Date.now();
    const v_43af15 = await v_a1651b()
      .prepare(
        `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
         VALUES (?, ?, ?, 'granted', ?, 'card', ?)`,
      )
      .bind(v_43e90c, v_6e0fd3, v_1833e7, v_5c2f9f, v_5c2f9f)
      .run();
    return v_43af15.meta.last_row_id as number;
  }

  v_23805a("source:'self' → clone_person_faces엔 'self', face_embeddings엔 'enroll'로 좁혀 기록(둘 다 throw 없이 성공)", async () => {
    const v_43e90c = await v_bfb240("t257n@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257n-clone");
    const v_ca1ec5 = await v_b18d0e(v_43e90c, v_6e0fd3, "셀프확정대상");

    const v_43c42e = await v_003ee1(v_c9c489 as never, {
      userId: v_43e90c,
      cloneId: v_6e0fd3,
      personId: v_ca1ec5,
      vectors: [v_46ff7a(20)],
      source: "self",
    });
    v_4d37e3(v_43c42e.enrolled).toBe(1);

    const v_550b91 = await v_a1651b()
      .prepare("SELECT source FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_ca1ec5)
      .first<{ source: string }>();
    v_4d37e3(v_550b91?.source).toBe("self");

    const v_ac752c = await v_a1651b()
      .prepare("SELECT source FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ source: string }>();
    v_4d37e3(v_ac752c?.source).toBe("enroll");
  });

  v_23805a("source:'call'(기본값) → 두 장부 모두 'call'로 기록(회귀 확인)", async () => {
    const v_43e90c = await v_bfb240("t257o@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "t257o-clone");
    const v_ca1ec5 = await v_b18d0e(v_43e90c, v_6e0fd3, "일반통화대상");

    const v_43c42e = await v_003ee1(v_c9c489 as never, {
      userId: v_43e90c,
      cloneId: v_6e0fd3,
      personId: v_ca1ec5,
      vectors: [v_46ff7a(21)],

    });
    v_4d37e3(v_43c42e.enrolled).toBe(1);

    const v_550b91 = await v_a1651b()
      .prepare("SELECT source FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_ca1ec5)
      .first<{ source: string }>();
    v_4d37e3(v_550b91?.source).toBe("call");

    const v_ac752c = await v_a1651b()
      .prepare("SELECT source FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ source: string }>();
    v_4d37e3(v_ac752c?.source).toBe("call");
  });
});

v_469bf2("POST /oth-path — 한 사람이 후보를 독점하지 않는다", () => {
  v_ff107d(() => {
    v_dbed3e();
  });

  function v_80cae9(v_468545): number[] {
    const v_81e2ef = new Array(512).fill(0);
    for (const [v_ebec57, v_62c214] of Object.entries(v_468545)) v_81e2ef[Number(v_ebec57)] = v_62c214;
    const v_f4e98d = Math.hypot(...v_81e2ef);
    return v_81e2ef.map((v_62c214) => v_62c214 / v_f4e98d);
  }

  async function v_a03658(v_21cc31, v_6e0fd3, v_1833e7): Promise<number> {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ cloneId: v_6e0fd3, displayName: v_1833e7, enrolledVia: "card" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { id: v_389afb } = await v_8f00b9.json<{ id: number }>();
    await v_1df298.fetch(`https://x/oth-path${v_389afb}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ state: "granted" }),
    });
    return v_389afb;
  }

  v_23805a("벡터가 많은 사람 A 가 있어도 점수가 조금 낮은 B 도 matches 에 나온다", async () => {
    const v_43e90c = await v_bfb240("topk-hog@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "topk-hog-clone");
    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_779914 = await v_a03658(v_21cc31, v_6e0fd3, "에이");
    const v_148ff6 = await v_a03658(v_21cc31, v_6e0fd3, "비");

    for (let v_ebec57 = 1; v_ebec57 <= 6; v_ebec57++) await v_a09be7(v_43e90c, v_6e0fd3, v_779914, v_80cae9({ 0: 1, [10 + v_ebec57]: 0.05 }));
    await v_a09be7(v_43e90c, v_6e0fd3, v_148ff6, v_80cae9({ 0: 0.8, 300: 0.6 }));

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${v_21cc31}` },
      body: JSON.stringify({ vector: v_80cae9({ 0: 1 }), cloneId: v_6e0fd3 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ matches: { personId: number; score: number }[] }>();
    const v_52e08b = v_4d33b2.matches.map((v_35f85c) => v_35f85c.personId);
    v_4d37e3(v_52e08b[0]).toBe(v_779914);
    v_4d37e3(v_52e08b).toContain(v_148ff6);
  });
});
