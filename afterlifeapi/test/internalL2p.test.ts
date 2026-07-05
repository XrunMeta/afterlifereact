import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_2f0be6(v_43e90c, v_8a1355 = null): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_8f00b9 = await v_a1651b
    .prepare(`INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at) VALUES (?, NULL, ?, 'none', ?)`)
    .bind(v_43e90c, v_8a1355, Date.now())
    .run();
  return v_8f00b9.meta.last_row_id as number;
}

async function v_b4fd78(v_be62d3, v_43e90c, v_6e0fd3): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)`)
    .bind(v_be62d3, v_43e90c, v_6e0fd3, Date.now())
    .run();
}

function v_3508ae(): string {
  return (v_c9c489 as { LEARN_SECRET: string }).LEARN_SECRET;
}

v_469bf2("internal l2p (T-067 Task9)", () => {
  v_23805a("① POST learn(Bearer LEARN_SECRET) → clone_ont_person 행 생성·병합", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("l2p-learn@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-learn-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c);
    await v_b4fd78("l2p-call-1", v_43e90c, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: v_ca1ec5,
        extracted: { relation: "이웃", memories_personal: ["같이 산책함"] },
        source: "call",
      }),
    });

    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { ok: boolean; skipped: boolean; rev: number };
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.skipped).toBe(false);
    v_4d37e3(v_4d33b2.rev).toBe(1);

    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_ca1ec5)
      .first<{ data: string }>();
    v_4d37e3(v_3ac7e7).not.toBeNull();
    const v_8decf8 = JSON.parse(v_3ac7e7!.data) as { relation: string; memories_personal: string[] };
    v_4d37e3(v_8decf8.relation).toBe("이웃");
    v_4d37e3(v_8decf8.memories_personal).toContain("같이 산책함");
  });

  v_23805a("② GET l2p → data 반환 + displayName 조인", async () => {
    const v_43e90c = await v_bfb240("l2p-get@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-get-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "김철수");
    await v_b4fd78("l2p-call-2", v_43e90c, v_6e0fd3);

    const v_f4c4fb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: v_ca1ec5,
        extracted: { relation: "친구" },
        source: "call",
      }),
    });
    v_4d37e3(v_f4c4fb.status).toBe(200);

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}`,
      { headers: { Authorization: `Bearer ${v_3508ae()}` } }
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { data: { relation: string } | null; displayName: string | null };
    v_4d37e3(v_4d33b2.data).not.toBeNull();
    v_4d37e3(v_4d33b2.data!.relation).toBe("친구");
    v_4d37e3(v_4d33b2.displayName).toBe("김철수");
  });

  v_23805a("③ 없는 person(personId 브루트포스) → 404 (mizu CRITICAL: 존재 유추 차단, 오라클 없음)", async () => {
    const v_43e90c = await v_bfb240("l2p-missing@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-missing-clone");

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=999999`,
      { headers: { Authorization: `Bearer ${v_3508ae()}` } }
    );
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_4d33b2 = (await v_8f00b9.json()) as { data?: unknown; displayName?: unknown };

    v_4d37e3(v_4d33b2.data).toBeUndefined();
    v_4d37e3(v_4d33b2.displayName).toBeUndefined();
  });

  v_23805a("GET l2p — person은 존재하나 이 clone과 통화 세션이 없는(비연관) 조합 → 404", async () => {
    const v_43e90c = await v_bfb240("l2p-unrelated@test.local");
    const v_18014a = await v_bfb240("l2p-unrelated-other@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-unrelated-clone");
    const v_79e62f = await v_4d24a9(v_18014a, "l2p-unrelated-other-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "박영희");

    await v_b4fd78("l2p-call-unrelated", v_43e90c, v_79e62f);

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}`,
      { headers: { Authorization: `Bearer ${v_3508ae()}` } }
    );
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("④ 잘못된 시크릿 → 401 (GET·POST 둘 다)", async () => {
    const v_511cca = await v_1df298.fetch("http://localhost/oth-path?personId=1", {
      headers: { Authorization: "Bearer WRONG" },
    });
    v_4d37e3(v_511cca.status).toBe(401);

    const v_515384 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer WRONG", "Content-Type": "application/json" },
      body: JSON.stringify({ personId: 1, extracted: {}, source: "call" }),
    });
    v_4d37e3(v_515384.status).toBe(401);
  });

  v_23805a("learn — clone과 통화 세션 없는 personId → 403 no_interaction (call_turns 미의존, 리뷰 수정)", async () => {
    const v_43e90c = await v_bfb240("l2p-nointeract@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-nointeract-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: v_ca1ec5, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: string };
    v_4d37e3(v_4d33b2.error).toBe("no_interaction");
  });

  v_23805a("learn — 빈 추출(no-op) → skipped:true, clone_ont_person 미기록", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("l2p-skip@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-skip-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c);
    await v_b4fd78("l2p-call-skip", v_43e90c, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: v_ca1ec5, extracted: {}, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { ok: boolean; skipped: boolean };
    v_4d37e3(v_4d33b2.skipped).toBe(true);

    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT 1 FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_ca1ec5)
      .first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("learn — 기존 clone_ont(user_id 키) 경로는 무수정(회귀)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("l2p-regression@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-regression-clone");
    await v_b4fd78("l2-regression-call", v_43e90c, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: v_43e90c, extracted: { relation: "가족" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(v_6e0fd3, v_43e90c)
      .first<{ data: string }>();
    v_4d37e3(v_3ac7e7).not.toBeNull();
  });
});
