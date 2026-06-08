import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `ws-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_86c39f(v_43e90c, v_b7f2b4 = false): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access", admin: v_b7f2b4 }, v_43fd42, 600);
}

function v_4d2f5b(v_b1de41, v_121982, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_b1de41}/warn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_121982}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2 ?? {}),
  });
}

function v_39eaf5(v_21cc31, v_556427): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${v_21cc31}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `idem-${v_556427}-${v_1923e2}`,
    },
    body: JSON.stringify({ name: "T", username: v_556427 }),
  });
}

async function v_0d7793(v_43e90c): Promise<string | null> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b.prepare("SELECT suspended_until AS s FROM users WHERE id = ?").bind(v_43e90c).first<{ s: string | null }>();
  return v_cb35cb?.s ?? null;
}

v_469bf2("경고(strike) + 비활성화 + 페르소나 생성 차단", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_warnings").first();
    } catch {
      throw new Error("D1 migrations not applied (0063).");
    }
  });

  v_23805a("경고 1·2회는 정지 안 됨, 3회째 정지 + suspendedUntil 설정", async () => {
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_86c39f(await v_bfb240(), true);

    const v_2d1eeb = (await (await v_4d2f5b(v_5f5d6d, v_b7f2b4)).json()) as { warningCount: number; suspended: boolean };
    v_4d37e3(v_2d1eeb.warningCount).toBe(1);
    v_4d37e3(v_2d1eeb.suspended).toBe(false);

    const v_b96973 = (await (await v_4d2f5b(v_5f5d6d, v_b7f2b4)).json()) as { warningCount: number; suspended: boolean };
    v_4d37e3(v_b96973.warningCount).toBe(2);
    v_4d37e3(v_b96973.suspended).toBe(false);

    const v_9e1cdb = (await (await v_4d2f5b(v_5f5d6d, v_b7f2b4)).json()) as {
      warningCount: number;
      suspended: boolean;
      suspendedUntil: string | null;
    };
    v_4d37e3(v_9e1cdb.warningCount).toBe(3);
    v_4d37e3(v_9e1cdb.suspended).toBe(true);
    v_4d37e3(v_9e1cdb.suspendedUntil).toBeTruthy();
    v_4d37e3(await v_0d7793(v_5f5d6d)).toBeTruthy();
  });

  v_23805a("정지 안 된 유저는 페르소나 생성 가능", async () => {
    const v_ceb55a = await v_bfb240();
    const v_21cc31 = await v_86c39f(v_ceb55a);
    const v_8f00b9 = await v_39eaf5(v_21cc31, `ws_ok_${v_1923e2}`);
    v_4d37e3([200, 201]).toContain(v_8f00b9.status);
  });

  v_23805a("정지된 유저는 페르소나 생성 차단(403 FORBIDDEN), 구경(피드)은 가능", async () => {
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_86c39f(await v_bfb240(), true);
    for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) await v_4d2f5b(v_5f5d6d, v_b7f2b4);
    v_4d37e3(await v_0d7793(v_5f5d6d)).toBeTruthy();

    const v_21cc31 = await v_86c39f(v_5f5d6d);
    const v_a7c0d4 = await v_39eaf5(v_21cc31, `ws_blocked_${v_1923e2}`);
    v_4d37e3(v_a7c0d4.status).toBe(403);
    const v_553e01 = (await v_a7c0d4.json()) as { error: { code: string } };
    v_4d37e3(v_553e01.error.code).toBe("FORBIDDEN");

    const v_8118b0 = await v_1df298.fetch("http://localhost/oth-path?limit=5");
    v_4d37e3(v_8118b0.status).toBe(200);
  });

  v_23805a("신고 기각 → status dismissed", async () => {

    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_349ab3 = await v_86c39f(v_4e6894);
    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_f10744 = await v_a1651b
      .prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?")
      .bind(v_4e6894, v_5f5d6d)
      .first<{ id: number }>();
    const v_99000e = v_f10744!.id;

    const v_b7f2b4 = await v_86c39f(await v_bfb240(), true);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_99000e}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_b7f2b4}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_33efc5 = await v_a1651b.prepare("SELECT status FROM user_reports WHERE id = ?").bind(v_99000e).first<{ status: string }>();
    v_4d37e3(v_33efc5?.status).toBe("dismissed");
  });
});
