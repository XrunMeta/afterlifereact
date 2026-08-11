

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_70df81 } from "../src/routes/persons";
import { v_a8d2cc } from "../src/lib/faceVectors";
import { v_929ead } from "../src/lib/cloneFaceScope";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_4f438a(v_ea333d, v_4d33b2) {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2("isFaceCalibrateEnabled (단위) — off 불변식", () => {
  v_23805a("env var 없음 → false(=404 경로)", () => {
    v_4d37e3(v_70df81({})).toBe(false);
  });
  v_23805a("'0' → false", () => {
    v_4d37e3(v_70df81({ FACE_CALIBRATE_ENABLED: "0" })).toBe(false);
  });
  v_23805a("'true'·다른 값 → false(엄격히 '1'만 on)", () => {
    v_4d37e3(v_70df81({ FACE_CALIBRATE_ENABLED: "true" })).toBe(false);
  });
  v_23805a("'' (빈 문자열) → false", () => {
    v_4d37e3(v_70df81({ FACE_CALIBRATE_ENABLED: "" })).toBe(false);
  });
  v_23805a("'1' → true", () => {
    v_4d37e3(v_70df81({ FACE_CALIBRATE_ENABLED: "1" })).toBe(true);
  });
});

v_469bf2("POST /oth-path (HTTP 통합 — 테스트 바인딩 on 고정)", () => {
  v_23805a("저장하고 벡터는 응답/DB에 없다", async () => {
    const v_43e90c = await v_bfb240("calibrate-on-save@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-on-save-clone");
    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, groundTruthPersonId: "p1", cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{
      id: number;
      matchedId: string | null;
      bestScore: number;
      threshold: number;
      scoreCount: number;
    }>();
    v_4d37e3(v_b75e36.id).toBeGreaterThan(0);
    v_4d37e3(typeof v_b75e36.bestScore).toBe("number");
    v_4d37e3(typeof v_b75e36.threshold).toBe("number");
    v_4d37e3(typeof v_b75e36.scoreCount).toBe("number");

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT * FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<Record<string, unknown>>();
    v_4d37e3(v_3ac7e7).toBeTruthy();
    v_4d37e3(v_3ac7e7!.user_id).toBe(String(v_43e90c));
    v_4d37e3(v_3ac7e7!.ground_truth_person_id).toBe("p1");

    v_4d37e3(JSON.stringify(v_3ac7e7)).not.toContain('"vector"');

    const v_392321 = JSON.parse(String(v_3ac7e7!.scores_json));
    v_4d37e3(Array.isArray(v_392321)).toBe(true);
    for (const v_fd5f43 of v_392321) {
      v_4d37e3(Object.keys(v_fd5f43).sort()).toEqual(["personId", "score"].sort());
    }
  });

  v_23805a("groundTruthPersonId 없이도 저장된다(선택 필드)", async () => {
    const v_43e90c = await v_bfb240("calibrate-no-gt@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-no-gt-clone");
    const v_f9a45c = new Array(512).fill(0.05);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ id: number }>();
    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT ground_truth_person_id FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<{ ground_truth_person_id: string | null }>();
    v_4d37e3(v_3ac7e7!.ground_truth_person_id).toBeNull();
  });

  v_23805a("다른 사용자의 calibrate 결과는 격리된다(namespace 스코핑)", async () => {
    const v_1badb6 = await v_bfb240("calibrate-owner@test.local");
    const v_7a3219 = await v_bfb240("calibrate-other@test.local");
    const v_40444e = await v_86c39f(v_1badb6);
    const v_825625 = await v_86c39f(v_7a3219);
    const v_3024f6 = await v_4d24a9(v_1badb6, "calibrate-owner-clone");
    const v_79e62f = await v_4d24a9(v_7a3219, "calibrate-other-clone");
    const v_f9a45c = new Array(512).fill(0.02);

    const v_2d1eeb = await v_4f438a(v_40444e, { vector: v_f9a45c, cloneId: v_3024f6 });
    v_4d37e3(v_2d1eeb.status).toBe(200);
    const v_b96973 = await v_4f438a(v_825625, { vector: v_f9a45c, cloneId: v_79e62f });
    v_4d37e3(v_b96973.status).toBe(200);

    const v_18b8bf = await v_a1651b()
      .prepare("SELECT user_id FROM faceoth-secretes WHERE user_id = ?")
      .bind(String(v_1badb6))
      .all<{ user_id: string }>();
    v_4d37e3(v_18b8bf.results.length).toBeGreaterThan(0);
    v_4d37e3(v_18b8bf.results.every((v_cb35cb) => v_cb35cb.user_id === String(v_1badb6))).toBe(true);
  });

  v_23805a("vector 길이 오류 → 400, 메시지에 벡터값 없음", async () => {
    const v_43e90c = await v_bfb240("calibrate-badvec@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: [1, 2, 3] });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_8d41d7 = await v_8f00b9.text();
    v_4d37e3(v_8d41d7).not.toContain("1,2,3");
  });

  v_23805a("vector 누락 → 400", async () => {
    const v_43e90c = await v_bfb240("calibrate-novec@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_4f438a(v_ea333d, {});
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("vector에 비수치 포함 → 400", async () => {
    const v_43e90c = await v_bfb240("calibrate-nonnumeric@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_0af197 = new Array(512).fill(0.1);
    v_0af197[0] = "x";
    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_0af197 });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("인증 없이 호출 → 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vector: new Array(512).fill(0.1) }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("metadata 없는 매치는 scores에서 제외된다(personId 둔갑 방지)", async () => {
    const v_43e90c = await v_bfb240("calibrate-no-metadata@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-no-metadata-clone");

    const v_e39ea6 = v_929ead(v_43e90c, v_6e0fd3);
    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    await v_e86ad8.insert([
      { id: "orphan-embedding-no-metadata", values: v_f9a45c, namespace: v_e39ea6 }, 
      { id: "with-metadata", values: v_f9a45c, namespace: v_e39ea6, metadata: { personId: "777" } },
    ]);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ id: number; matchedId: string | null; scoreCount: number }>();

    v_4d37e3(v_b75e36.scoreCount).toBe(1);

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT scores_json FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<{ scores_json: string }>();
    const v_392321 = JSON.parse(String(v_3ac7e7!.scores_json)) as { personId: string; score: number }[];
    v_4d37e3(v_392321.length).toBe(1);
    v_4d37e3(v_392321[0].personId).toBe("777");
    v_4d37e3(v_392321.some((v_fd5f43) => v_fd5f43.personId === "orphan-embedding-no-metadata")).toBe(false);
  });

  async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
    await v_a1651b()
      .prepare(
        `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
         VALUES (?, ?, ?, 'granted', 1)`,
      )
      .bind(v_43e90c, v_6e0fd3, v_1833e7)
      .run();
    const v_e2a85c = await v_a1651b()
      .prepare("SELECT id FROM persons WHERE user_id = ? AND clone_id = ? AND display_name = ?")
      .bind(v_43e90c, v_6e0fd3, v_1833e7)
      .first<{ id: number }>();
    return v_e2a85c!.id;
  }

  v_23805a("매칭된 person 에 L2'(clone_ont_person)가 있으면 matchedHasL2p=true 로 응답·저장된다", async () => {
    const v_43e90c = await v_bfb240("calibrate-l2p-yes@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-l2p-yes-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, v_6e0fd3, "L2P있음");
    await v_a1651b()
      .prepare(`INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{"rel":"친구"}', 1)`)
      .bind(v_6e0fd3, v_ca1ec5)
      .run();

    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 1 ? 1 : 0));
    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    await v_e86ad8.insert([
      {
        id: `l2p-yes-${v_ca1ec5}`,
        values: v_f9a45c,
        namespace: v_929ead(v_43e90c, v_6e0fd3),
        metadata: { personId: String(v_ca1ec5) },
      },
    ]);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ id: number; matchedId: string | null; matchedHasL2p: boolean | null }>();
    v_4d37e3(v_b75e36.matchedId).toBe(String(v_ca1ec5));
    v_4d37e3(v_b75e36.matchedHasL2p).toBe(true);

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT matched_has_l2p FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<{ matched_has_l2p: number | null }>();
    v_4d37e3(v_3ac7e7!.matched_has_l2p).toBe(1);
  });

  v_23805a("매칭은 됐지만 L2' 가 없으면 matchedHasL2p=false (인식 성공 · 기억 비어 있음)", async () => {
    const v_43e90c = await v_bfb240("calibrate-l2p-no@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-l2p-no-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, v_6e0fd3, "L2P없음");

    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 2 ? 1 : 0));
    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    await v_e86ad8.insert([
      {
        id: `l2p-no-${v_ca1ec5}`,
        values: v_f9a45c,
        namespace: v_929ead(v_43e90c, v_6e0fd3),
        metadata: { personId: String(v_ca1ec5) },
      },
    ]);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ id: number; matchedId: string | null; matchedHasL2p: boolean | null }>();
    v_4d37e3(v_b75e36.matchedId).toBe(String(v_ca1ec5));
    v_4d37e3(v_b75e36.matchedHasL2p).toBe(false); 

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT matched_has_l2p FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<{ matched_has_l2p: number | null }>();
    v_4d37e3(v_3ac7e7!.matched_has_l2p).toBe(0);
  });

  v_23805a("미매칭(matchedId=null)이면 matchedHasL2p=null — 판정 불가를 false 로 접지 않는다", async () => {
    const v_43e90c = await v_bfb240("calibrate-l2p-nomatch@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "calibrate-l2p-nomatch-clone");
    const v_f9a45c = new Array(512).fill(0.02);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_6e0fd3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ id: number; matchedId: string | null; matchedHasL2p: boolean | null }>();
    v_4d37e3(v_b75e36.matchedId).toBeNull();
    v_4d37e3(v_b75e36.matchedHasL2p).toBeNull();

    const v_3ac7e7 = await v_a1651b()
      .prepare("SELECT matched_has_l2p FROM faceoth-secretes WHERE id = ?")
      .bind(v_b75e36.id)
      .first<{ matched_has_l2p: number | null }>();
    v_4d37e3(v_3ac7e7!.matched_has_l2p).toBeNull();
  });

  v_23805a("다른 클론의 L2' 는 세지 않는다(clone_id 스코프)", async () => {
    const v_43e90c = await v_bfb240("calibrate-l2p-scope@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_c521ce = await v_4d24a9(v_43e90c, "calibrate-l2p-scope-a");
    const v_65cfbc = await v_4d24a9(v_43e90c, "calibrate-l2p-scope-b");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, v_c521ce, "스코프");

    await v_a1651b()
      .prepare(`INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', 1)`)
      .bind(v_65cfbc, v_ca1ec5)
      .run();

    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 3 ? 1 : 0));
    const v_e86ad8 = v_a8d2cc(v_c9c489 as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    await v_e86ad8.insert([
      {
        id: `l2p-scope-${v_ca1ec5}`,
        values: v_f9a45c,
        namespace: v_929ead(v_43e90c, v_c521ce),
        metadata: { personId: String(v_ca1ec5) },
      },
    ]);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, cloneId: v_c521ce });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ matchedId: string | null; matchedHasL2p: boolean | null }>();
    v_4d37e3(v_b75e36.matchedId).toBe(String(v_ca1ec5));
    v_4d37e3(v_b75e36.matchedHasL2p).toBe(false);
  });
});

v_469bf2("GET /oth-path (폴링 조회 — Task 2)", () => {

  async function v_38715b(v_ea333d, v_212049 = "") {
    return v_1df298.fetch(`http://localhost/oth-path${v_212049}`, {
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
  }

  v_23805a("자기 userId 샘플만, since 커서 동작", async () => {
    const v_79e089 = await v_bfb240("calibrate-samples-u1@test.local");
    const v_b1ff3f = await v_bfb240("calibrate-samples-u2@test.local");
    const v_8e3313 = await v_86c39f(v_79e089);

    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, 'p1', 0.9, 0.83, '[{"personId":"p1","score":0.9}]', 1),
                (?, NULL, NULL, 0.4, 0.83, '[]', 2),
                (?, NULL, 'p9', 0.8, 0.83, '[]', 3)`
      )
      .bind(String(v_79e089), String(v_79e089), String(v_b1ff3f))
      .run();

    const v_8f00b9 = await v_38715b(v_8e3313);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{
      samples: { id: number; matchedId: string | null }[];
      nextSince: number;
    }>();
    v_4d37e3(v_b75e36.samples.length).toBe(2);
    v_4d37e3(v_b75e36.samples.every((v_fd5f43) => v_fd5f43.matchedId !== "p9")).toBe(true); 

    const v_48bbbd = await v_38715b(v_8e3313, `?since=${v_b75e36.samples[0].id}`);
    v_4d37e3(v_48bbbd.status).toBe(200);
    const v_5d792d = await v_48bbbd.json<{ samples: unknown[] }>();
    v_4d37e3(v_5d792d.samples.length).toBe(1);
  });

  v_23805a("scores_json을 파싱해 scores 배열/필드 매핑으로 반환한다", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-scores@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, 'p1', 'p1', 0.92, 0.83, '[{"personId":"p1","score":0.92},{"personId":"p2","score":0.3}]', 10)`
      )
      .bind(String(v_ceb55a))
      .run();

    const v_8f00b9 = await v_38715b(v_ea333d);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{
      samples: {
        id: number;
        ts: number;
        groundTruthPersonId: string | null;
        matchedId: string | null;
        bestScore: number;
        threshold: number;
        scores: { personId: string; score: number }[];
      }[];
    }>();
    v_4d37e3(v_b75e36.samples.length).toBe(1);
    const v_fd5f43 = v_b75e36.samples[0];
    v_4d37e3(v_fd5f43.ts).toBe(10);
    v_4d37e3(v_fd5f43.groundTruthPersonId).toBe("p1");
    v_4d37e3(v_fd5f43.matchedId).toBe("p1");
    v_4d37e3(v_fd5f43.bestScore).toBe(0.92);
    v_4d37e3(v_fd5f43.threshold).toBe(0.83);
    v_4d37e3(v_fd5f43.scores).toEqual([
      { personId: "p1", score: 0.92 },
      { personId: "p2", score: 0.3 },
    ]);
  });

  v_23805a("matched_has_l2p 를 3상태(null/false/true)로 매핑해 반환한다", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-l2p@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at, matched_has_l2p)
         VALUES (?, NULL, 'p1', 0.9, 0.83, '[]', 200, 1),
                (?, NULL, 'p2', 0.9, 0.83, '[]', 201, 0),
                (?, NULL, NULL, 0.1, 0.83, '[]', 202, NULL)`
      )
      .bind(String(v_ceb55a), String(v_ceb55a), String(v_ceb55a))
      .run();

    const v_8f00b9 = await v_38715b(v_ea333d);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ samples: { matchedId: string | null; matchedHasL2p: boolean | null }[] }>();
    v_4d37e3(v_b75e36.samples.length).toBe(3);
    v_4d37e3(v_b75e36.samples.map((v_fd5f43) => v_fd5f43.matchedHasL2p)).toEqual([true, false, null]);
  });

  v_23805a("limit 파라미터가 페이지 크기를 제한하고 nextSince를 갱신한다", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-limit@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 100),
                (?, NULL, NULL, 0.1, 0.83, '[]', 101),
                (?, NULL, NULL, 0.1, 0.83, '[]', 102)`
      )
      .bind(String(v_ceb55a), String(v_ceb55a), String(v_ceb55a))
      .run();

    const v_8f00b9 = await v_38715b(v_ea333d, "?limit=2");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ samples: { id: number }[]; nextSince: number }>();
    v_4d37e3(v_b75e36.samples.length).toBe(2);
    v_4d37e3(v_b75e36.nextSince).toBe(v_b75e36.samples[1].id);
  });

  v_23805a("인증 없이 호출 → 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("since가 최대 id 이상이면 빈 배열 + nextSince === since(커서 되감김 없음)", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-since-beyond@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 200)`
      )
      .bind(String(v_ceb55a))
      .run();

    const v_5bdc2d = 999999;
    const v_8f00b9 = await v_38715b(v_ea333d, `?since=${v_5bdc2d}`);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ samples: unknown[]; nextSince: number }>();
    v_4d37e3(v_b75e36.samples.length).toBe(0);
    v_4d37e3(v_b75e36.nextSince).toBe(v_5bdc2d);
  });

  v_23805a("since=-1(음수)·since=abc(NaN) → 0으로 폴백해 첫 페이지 정상 반환", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-since-fallback@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 300)`
      )
      .bind(String(v_ceb55a))
      .run();

    const v_845666 = await v_38715b(v_ea333d);
    v_4d37e3(v_845666.status).toBe(200);
    const v_37c475 = await v_845666.json<{ samples: unknown[] }>();

    const v_bc4abd = await v_38715b(v_ea333d, "?since=-1");
    v_4d37e3(v_bc4abd.status).toBe(200);
    const v_74867f = await v_bc4abd.json<{ samples: unknown[] }>();
    v_4d37e3(v_74867f.samples.length).toBe(v_37c475.samples.length);

    const v_dc1ed6 = await v_38715b(v_ea333d, "?since=abc");
    v_4d37e3(v_dc1ed6.status).toBe(200);
    const v_f99fce = await v_dc1ed6.json<{ samples: unknown[] }>();
    v_4d37e3(v_f99fce.samples.length).toBe(v_37c475.samples.length);
  });

  v_23805a("limit=999 → 에러 없이 동작(내부 200 clamp), 시드 건수 이하로 반환", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-limit-over@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, NULL, 0.1, 0.83, '[]', 400),
                (?, NULL, NULL, 0.1, 0.83, '[]', 401),
                (?, NULL, NULL, 0.1, 0.83, '[]', 402)`
      )
      .bind(String(v_ceb55a), String(v_ceb55a), String(v_ceb55a))
      .run();

    const v_8f00b9 = await v_38715b(v_ea333d, "?limit=999");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{ samples: unknown[] }>();

    v_4d37e3(v_b75e36.samples.length).toBe(3);
  });

  v_23805a("scores_json이 손상된 행이 있어도 500이 아니라 그 행만 scores:[]로 폴백하고 커서가 전진한다", async () => {
    const v_ceb55a = await v_bfb240("calibrate-samples-corrupt-json@test.local");
    const v_ea333d = await v_86c39f(v_ceb55a);
    await v_a1651b()
      .prepare(
        `INSERT INTO faceoth-secretes
           (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
         VALUES (?, NULL, 'p1', 0.5, 0.83, 'not-valid-json{{{', 500),
                (?, NULL, 'p2', 0.6, 0.83, '[{"personId":"p2","score":0.6}]', 501)`
      )
      .bind(String(v_ceb55a), String(v_ceb55a))
      .run();

    const v_8f00b9 = await v_38715b(v_ea333d);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = await v_8f00b9.json<{
      samples: { id: number; matchedId: string | null; scores: unknown[] }[];
      nextSince: number;
    }>();
    v_4d37e3(v_b75e36.samples.length).toBe(2);
    const v_d6e93f = v_b75e36.samples.find((v_fd5f43) => v_fd5f43.matchedId === "p1")!;
    const v_3ed4c3 = v_b75e36.samples.find((v_fd5f43) => v_fd5f43.matchedId === "p2")!;
    v_4d37e3(v_d6e93f.scores).toEqual([]);
    v_4d37e3(v_3ed4c3.scores).toEqual([{ personId: "p2", score: 0.6 }]);

    v_4d37e3(v_b75e36.nextSince).toBe(v_3ed4c3.id);
  });

});

v_469bf2("wrangler.toml FACE_CALIBRATE_ENABLED 정적 안전망(prod 오ON 방지)", () => {
  v_23805a("base 와 production 은 \"0\", preview 만 \"1\" 이다", async () => {

    const { default: v_6e2bcc } = await import("../wrangler.toml?raw");

    const v_8d41d7 = v_6e2bcc as string;
    const v_abc8f4 = (v_b4fa6c): string | null => {

      const v_965edf = v_b4fa6c === "" ? 0 : v_8d41d7.indexOf(`[${v_b4fa6c}]`);
      v_4d37e3(v_965edf).toBeGreaterThanOrEqual(0);
      const v_83bbcd = v_8d41d7.slice(v_965edf + v_b4fa6c.length + 2);
      const v_2f4015 = v_83bbcd.search(/\n\[/);
      const v_4d33b2 = v_2f4015 === -1 ? v_83bbcd : v_83bbcd.slice(0, v_2f4015);
      const v_35f85c = v_4d33b2.match(/FACE_CALIBRATE_ENABLED\s*=\s*"([^"]*)"/);
      return v_35f85c ? v_35f85c[1] : null;
    };

    const v_48c915 = [...v_8d41d7.matchAll(/FACE_CALIBRATE_ENABLED\s*=\s*"([^"]*)"/g)];
    v_4d37e3(v_48c915.length).toBe(3);

    v_4d37e3(v_abc8f4("env.production.vars")).toBe("0");

    v_4d37e3(v_abc8f4("env.preview.vars")).toBe("1");
  });
});
