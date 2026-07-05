import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_a8d2cc } from "../src/lib/faceVectors";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_4e7b87(v_ea333d): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const { id: v_389afb } = (await v_8f00b9.json()) as { id: number };
  return v_389afb;
}

async function v_a56201(v_ea333d, v_ca1ec5) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: "granted" }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
}

function v_46ff7a(v_4a1c36 = 0.1): number[] {
  return Array(512).fill(v_4a1c36);
}

async function v_eb0ef3(v_ea333d, v_ca1ec5, v_4a1c36 = 0.1) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vectors: [v_46ff7a(v_4a1c36)] }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
}

async function v_a94a1b(v_ea333d, v_ca1ec5) {
  return v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${v_ea333d}` },
  });
}

async function v_2266b0(v_ca1ec5): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_be62d3 = `call-${v_ca1ec5}-${Date.now()}`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO call_turns (call_id, seq, role, text, created_at, speaker_person_id)
       VALUES (?, 1, 'user', 'hi', ?, ?)`
    )
    .bind(v_be62d3, Date.now(), v_ca1ec5)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

v_469bf2("DELETE /oth-path", () => {
  v_23805a("enroll된 person 삭제 → 200, face_embeddings/clone_ont_person 행 0 + consent_log 보존(삭제 감사행 추가) + call_turns FK NULL화 + 같은 벡터 match 빈 결과", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("del-full@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);
    await v_a56201(v_ea333d, v_ca1ec5); 
    await v_eb0ef3(v_ea333d, v_ca1ec5, 0.1);

    await v_a1651b
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(1, v_ca1ec5, Date.now())
      .run();

    const v_544e9a = await v_2266b0(v_ca1ec5);

    const v_8f00b9 = await v_a94a1b(v_ea333d, v_ca1ec5);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { deleted: boolean };
    v_4d37e3(v_4d33b2.deleted).toBe(true);

    const v_e2a85c = await v_a1651b.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_e2a85c?.c).toBe(0);
    const v_ac752c = await v_a1651b
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ c: number }>();
    v_4d37e3(v_ac752c?.c).toBe(0);
    const v_af3d78 = await v_a1651b
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ c: number }>();
    v_4d37e3(v_af3d78?.c).toBe(0);

    const v_056206 = await v_a1651b
      .prepare("SELECT state, channel FROM persons_consent_log WHERE person_id = ? ORDER BY id ASC")
      .bind(v_ca1ec5)
      .all<{ state: string; channel: string | null }>();
    v_4d37e3(v_056206.results.length).toBe(2); 
    v_4d37e3(v_056206.results[0].state).toBe("granted");
    const v_506e86 = v_056206.results[v_056206.results.length - 1];
    v_4d37e3(v_506e86.state).toBe("revoked");
    v_4d37e3(v_506e86.channel).toBe("face_delete");

    const v_8dbe6c = await v_a1651b
      .prepare("SELECT speaker_person_id FROM call_turns WHERE id = ?")
      .bind(v_544e9a)
      .first<{ speaker_person_id: number | null }>();
    v_4d37e3(v_8dbe6c?.speaker_person_id).toBe(null);

    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    const v_80a1ce = await v_e86ad8.query(v_46ff7a(0.1), { topK: 3, namespace: String(v_43e90c), returnMetadata: true });
    v_4d37e3(v_80a1ce.matches.length).toBe(0);
  });

  v_23805a("완전 삭제 후 재호출 → 404", async () => {
    const v_43e90c = await v_bfb240("del-redelete@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);
    await v_a56201(v_ea333d, v_ca1ec5);
    await v_eb0ef3(v_ea333d, v_ca1ec5, 0.2);

    const v_ea719c = await v_a94a1b(v_ea333d, v_ca1ec5);
    v_4d37e3(v_ea719c.status).toBe(200);

    const v_486a80 = await v_a94a1b(v_ea333d, v_ca1ec5);
    v_4d37e3(v_486a80.status).toBe(404);
    const v_4d33b2 = (await v_486a80.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("NOT_FOUND");
  });

  v_23805a("부분 실패 후 재시도(진짜 재현) — Vectorize만 먼저 소멸(라우트 밖 직접 호출)된 상태에서 재호출해도 deleteByIds no-op으로 200 완결·전 테이블 정리", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("del-partial@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_ca1ec5 = await v_4e7b87(v_ea333d);
    await v_a56201(v_ea333d, v_ca1ec5);
    await v_eb0ef3(v_ea333d, v_ca1ec5, 0.3);
    await v_a1651b
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(2, v_ca1ec5, Date.now())
      .run();
    const v_544e9a = await v_2266b0(v_ca1ec5);

    const v_61c797 = await v_a1651b
      .prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .all<{ vectorize_id: string | null }>();
    const v_23dafb = v_61c797.results.map((v_cb35cb) => v_cb35cb.vectorize_id).filter((v_81e2ef): v_81e2ef is string => Boolean(v_81e2ef));
    v_4d37e3(v_23dafb.length).toBeGreaterThan(0);
    await v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).deleteByIds(v_23dafb);

    const v_8f00b9 = await v_a94a1b(v_ea333d, v_ca1ec5);
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_e2a85c = await v_a1651b.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(v_ca1ec5).first<{ c: number }>();
    v_4d37e3(v_e2a85c?.c).toBe(0);
    const v_ac752c = await v_a1651b
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ c: number }>();
    v_4d37e3(v_ac752c?.c).toBe(0);
    const v_af3d78 = await v_a1651b
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(v_ca1ec5)
      .first<{ c: number }>();
    v_4d37e3(v_af3d78?.c).toBe(0);
    const v_8dbe6c = await v_a1651b
      .prepare("SELECT speaker_person_id FROM call_turns WHERE id = ?")
      .bind(v_544e9a)
      .first<{ speaker_person_id: number | null }>();
    v_4d37e3(v_8dbe6c?.speaker_person_id).toBe(null);
  });

  v_23805a("타인 소유 person → 404", async () => {
    const v_257b90 = await v_bfb240("del-owner@test.local");
    const v_53bb36 = await v_bfb240("del-attacker@test.local");
    const v_40444e = await v_86c39f(v_257b90);
    const v_d82c92 = await v_86c39f(v_53bb36);

    const v_ca1ec5 = await v_4e7b87(v_40444e);

    const v_8f00b9 = await v_a94a1b(v_d82c92, v_ca1ec5);
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("NOT_FOUND");
  });

  v_23805a("비정수 person id → 422 VALIDATION_FAILED", async () => {
    const v_43e90c = await v_bfb240("del-nanid@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });

    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });
});
