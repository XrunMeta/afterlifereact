import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_3a8949): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_8e2039(v_43e90c, v_6e0fd3): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?")
    .bind(v_43e90c, v_6e0fd3)
    .first<{ n: number }>();
  return v_3ac7e7?.n ?? 0;
}

async function v_ce1ef9(v_43e90c, v_6e0fd3): Promise<number | null> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT id FROM persons WHERE user_id = ? AND clone_id = ?")
    .bind(v_43e90c, v_6e0fd3)
    .first<{ id: number }>();
  return v_3ac7e7?.id ?? null;
}

async function v_d13674(v_6e0fd3, v_ca1ec5): Promise<boolean> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT 1 AS x FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
    .bind(v_6e0fd3, v_ca1ec5)
    .first<{ x: number }>();
  return !!v_3ac7e7;
}

const v_8fe3be = "http://orchestrator.test";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

function v_a12543(v_be62d3) {
  v_8fd90d
    .get(v_8fe3be)
    .intercept({ path: "/oth-path", method: "POST" })
    .reply(200, { callId: v_be62d3, subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" });
}

v_469bf2("POST /oth-path — 전문가 클론 계정 직접 식별 배선", () => {
  v_23805a("전문가 클론 통화 시작 → person 1개 + L2′ 즉시 확보", async () => {
    const v_257b90 = await v_bfb240("ecs-owner1@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-expert1", "expert");
    const v_2433e3 = await v_bfb240("ecs-guest1@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);

    v_a12543("ecs-call-1");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    v_4d37e3(await v_8e2039(v_2433e3, v_6e0fd3)).toBe(1);
    const v_ca1ec5 = await v_ce1ef9(v_2433e3, v_6e0fd3);
    v_4d37e3(v_ca1ec5).not.toBeNull();
    v_4d37e3(await v_d13674(v_6e0fd3, v_ca1ec5!)).toBe(true);
  });

  v_23805a("재통화해도 같은 person 재사용 — 중복 생성 없음", async () => {
    const v_257b90 = await v_bfb240("ecs-owner2@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-expert2", "expert");
    const v_2433e3 = await v_bfb240("ecs-guest2@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);

    v_a12543("ecs-call-2a");
    const v_2d1eeb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_2d1eeb.status).toBe(200);
    const v_84739c = await v_ce1ef9(v_2433e3, v_6e0fd3);

    v_a12543("ecs-call-2b");
    const v_b96973 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_b96973.status).toBe(200);

    v_4d37e3(await v_8e2039(v_2433e3, v_6e0fd3)).toBe(1);
    v_4d37e3(await v_ce1ef9(v_2433e3, v_6e0fd3)).toBe(v_84739c);
  });

  v_23805a("개인(memlow) 클론 통화 시작은 계정 person을 만들지 않는다", async () => {
    const v_257b90 = await v_bfb240("ecs-owner3@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-personal3", "memlow");
    const v_2433e3 = await v_bfb240("ecs-guest3@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);

    v_a12543("ecs-call-3");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    v_4d37e3(await v_8e2039(v_2433e3, v_6e0fd3)).toBe(0);
  });

  v_23805a("ensureAccountPerson 실패해도 통화 시작은 깨지지 않는다(best-effort)", async () => {
    const v_257b90 = await v_bfb240("ecs-owner4@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-expert4", "expert");
    const v_2433e3 = await v_bfb240("ecs-guest4@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b.prepare("ALTER TABLE clone_ont_person RENAME TO clone_ont_person_bak_t257").run();
    try {
      v_a12543("ecs-call-4");
      const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_ea333d}` },
      });

      v_4d37e3(v_8f00b9.status).toBe(200);
    } finally {
      await v_a1651b.prepare("ALTER TABLE clone_ont_person_bak_t257 RENAME TO clone_ont_person").run();
    }
  });
});

v_469bf2("POST /oth-path — 전문가 클론 계정 직접 식별 배선", () => {
  v_23805a("전문가 클론 prethird-start → person 1개 + L2′ 즉시 확보", async () => {
    const v_257b90 = await v_bfb240("ecs-p-owner1@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-p-expert1", "expert");
    const v_2433e3 = await v_bfb240("ecs-p-guest1@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "aaaaaaaaaaaa" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    v_4d37e3(await v_8e2039(v_2433e3, v_6e0fd3)).toBe(1);
    const v_ca1ec5 = await v_ce1ef9(v_2433e3, v_6e0fd3);
    v_4d37e3(await v_d13674(v_6e0fd3, v_ca1ec5!)).toBe(true);
  });

  v_23805a("개인(memlow) 클론 prethird-start는 계정 person을 만들지 않는다", async () => {
    const v_257b90 = await v_bfb240("ecs-p-owner2@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "ecs-p-personal2", "memlow");
    const v_2433e3 = await v_bfb240("ecs-p-guest2@test.local");
    const v_ea333d = await v_86c39f(v_2433e3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "bbbbbbbbbbbb" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8e2039(v_2433e3, v_6e0fd3)).toBe(0);
  });
});
