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

async function v_2f0be6(v_43e90c, v_8a1355 = null, v_6e0fd3 = null): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_8f00b9 = await v_a1651b
    .prepare(`INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at) VALUES (?, ?, ?, 'none', ?)`)
    .bind(v_43e90c, v_6e0fd3, v_8a1355, Date.now())
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
    const v_ca1ec5 = await v_2f0be6(v_43e90c, null, v_6e0fd3);
    await v_b4fd78("l2p-call-1", v_43e90c, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: v_ca1ec5, userId: v_43e90c,
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
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "김철수", v_6e0fd3);
    await v_b4fd78("l2p-call-2", v_43e90c, v_6e0fd3);

    const v_f4c4fb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: v_ca1ec5, userId: v_43e90c,
        extracted: { relation: "친구" },
        source: "call",
      }),
    });
    v_4d37e3(v_f4c4fb.status).toBe(200);

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}&userId=${v_43e90c}`,
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
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=999999&userId=${v_43e90c}`,
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
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "박영희", v_6e0fd3);

    await v_b4fd78("l2p-call-unrelated", v_43e90c, v_79e62f);

    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}&userId=${v_43e90c}`,
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
    const v_ca1ec5 = await v_2f0be6(v_43e90c, null, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: v_ca1ec5, userId: v_43e90c, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = (await v_8f00b9.json()) as { error: string };
    v_4d37e3(v_4d33b2.error).toBe("no_interaction");
  });

  v_23805a("learn — 빈 추출(no-op) → skipped:true, clone_ont_person 미기록", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_43e90c = await v_bfb240("l2p-skip@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "l2p-skip-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, null, v_6e0fd3);
    await v_b4fd78("l2p-call-skip", v_43e90c, v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: v_ca1ec5, userId: v_43e90c, extracted: {}, source: "call" }),
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

  v_23805a("AFL-1030 GET l2p — 같은 user x clone person → 200 (userId 쿼리 포함)", async () => {
    const v_43e90c = await v_bfb240("afl1030-ok@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "afl1030-ok-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "정상", v_6e0fd3);
    await v_b4fd78("afl1030-call-ok", v_43e90c, v_6e0fd3);
    const v_694b25 = `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}`;
    const v_65a2cd = { headers: { Authorization: `Bearer ${v_3508ae()}` } };
    v_4d37e3((await v_1df298.fetch(`${v_694b25}&userId=${v_43e90c}`, v_65a2cd)).status).toBe(200);

    v_4d37e3((await v_1df298.fetch(v_694b25, v_65a2cd)).status).toBe(400);
  });

  v_23805a("AFL-1030 GET l2p — 다른 클론 소속 person → 404 (같은 계정이 이 클론과 통화했어도)", async () => {
    const v_43e90c = await v_bfb240("afl1030-oc@test.local");
    const v_c521ce = await v_4d24a9(v_43e90c, "afl1030-oc-a");
    const v_65cfbc = await v_4d24a9(v_43e90c, "afl1030-oc-b");
    const v_347b9f = await v_2f0be6(v_43e90c, "B전용", v_65cfbc);
    await v_b4fd78("afl1030-call-oc-a", v_43e90c, v_c521ce);
    await v_b4fd78("afl1030-call-oc-b", v_43e90c, v_65cfbc);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_c521ce}/l2p?personId=${v_347b9f}&userId=${v_43e90c}`,
      { headers: { Authorization: `Bearer ${v_3508ae()}` } });
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_bf38f6 = await v_1df298.fetch(`http://localhost/oth-path${v_c521ce}/memory/l2p/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: v_347b9f, userId: v_43e90c, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_bf38f6.status).toBe(403);
  });

  v_23805a("AFL-1030 GET l2p — userId 가 person 소유 계정이 아니면 404, 형식 오류는 400", async () => {
    const v_43e90c = await v_bfb240("afl1030-ou@test.local");
    const v_fd4fce = await v_bfb240("afl1030-ou-other@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "afl1030-ou-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "내사람", v_6e0fd3);
    await v_b4fd78("afl1030-call-ou", v_43e90c, v_6e0fd3);
    await v_b4fd78("afl1030-call-ou2", v_fd4fce, v_6e0fd3);
    const v_65a2cd = { headers: { Authorization: `Bearer ${v_3508ae()}` } };
    const v_694b25 = `http://localhost/oth-path${v_6e0fd3}/l2p?personId=${v_ca1ec5}`;
    v_4d37e3((await v_1df298.fetch(`${v_694b25}&userId=${v_fd4fce}`, v_65a2cd)).status).toBe(404);
    v_4d37e3((await v_1df298.fetch(`${v_694b25}&userId=abc`, v_65a2cd)).status).toBe(400);
  });

  v_23805a("AFL-1030 POST l2p/learn — userId 누락 400 · 타 계정 userId 403 · 정상 200", async () => {
    const v_43e90c = await v_bfb240("afl1030-learn@test.local");
    const v_fd4fce = await v_bfb240("afl1030-learn-other@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "afl1030-learn-clone");
    const v_ca1ec5 = await v_2f0be6(v_43e90c, "학습", v_6e0fd3);
    await v_b4fd78("afl1030-learn-call", v_43e90c, v_6e0fd3);
    await v_b4fd78("afl1030-learn-call2", v_fd4fce, v_6e0fd3);
    const v_4f438a = (v_4d33b2) =>
      v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/memory/l2p/learn`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_3508ae()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ personId: v_ca1ec5, extracted: { relation: "친구" }, source: "call", ...v_4d33b2 }),
      });
    v_4d37e3((await v_4f438a({})).status).toBe(400);
    v_4d37e3((await v_4f438a({ userId: v_fd4fce })).status).toBe(403);
    v_4d37e3((await v_4f438a({ userId: v_43e90c })).status).toBe(200);
  });
});
