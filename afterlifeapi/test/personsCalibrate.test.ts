

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";
import { v_70df81 } from "../src/routes/persons";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
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
  v_23805a("'1' → true", () => {
    v_4d37e3(v_70df81({ FACE_CALIBRATE_ENABLED: "1" })).toBe(true);
  });
});

v_469bf2("POST /oth-path (HTTP 통합 — 테스트 바인딩 on 고정)", () => {
  v_23805a("저장하고 벡터는 응답/DB에 없다", async () => {
    const v_43e90c = await v_bfb240("calibrate-on-save@test.local");
    const v_ea333d = await v_86c39f(v_43e90c);
    const v_f9a45c = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c, groundTruthPersonId: "p1" });
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
    const v_f9a45c = new Array(512).fill(0.05);

    const v_8f00b9 = await v_4f438a(v_ea333d, { vector: v_f9a45c });
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
    const v_f9a45c = new Array(512).fill(0.02);

    const v_2d1eeb = await v_4f438a(v_40444e, { vector: v_f9a45c });
    v_4d37e3(v_2d1eeb.status).toBe(200);
    const v_b96973 = await v_4f438a(v_825625, { vector: v_f9a45c });
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
});
