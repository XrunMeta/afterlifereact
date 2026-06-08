import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `rr-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c, v_b7f2b4 = false): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
  return await v_b2eae5({ sub: v_43e90c, kind: "access", admin: v_b7f2b4 }, v_43fd42, 600);
}

function v_9639f0(v_9fe22d, v_121982, v_bfe9b9 = "GET", v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_121982}`, "Content-Type": "application/json" },
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

async function v_3e0055(v_43e90c): Promise<string | null> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b.prepare("SELECT suspended_until AS s FROM users WHERE id = ?").bind(v_43e90c).first<{ s: string | null }>();
  return v_cb35cb?.s ?? null;
}

v_469bf2("신고 누적 조건 — 설정 기반 벌칙", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM report_penalty_rules").first();
    } catch {
      throw new Error("D1 migrations not applied (0064).");
    }
  });

  v_23805a("GET 규칙 — 기본 시드(1·2 경고, 3 정지30) 반환", async () => {
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_8f00b9 = await v_9639f0(`/oth-path`, v_b7f2b4);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { items: Array<{ threshold: number; action: string; suspendDays: number | null }> };
    const v_dfdbc1 = v_7ecfd1.items.find((v_cb35cb) => v_cb35cb.threshold === 3);

    v_4d37e3(v_dfdbc1?.action).toBe("clone_create_ban");
    v_4d37e3(v_dfdbc1?.suspendDays).toBe(30);
  });

  v_23805a("규칙을 1회=7일 정지로 설정 → 첫 경고에 7일 정지 적용", async () => {
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);

    const v_4abc91 = await v_9639f0(`/oth-path`, v_b7f2b4, "PUT", {
      action: "suspend",
      suspendDays: 7,
    });
    v_4d37e3(v_4abc91.status).toBe(200);

    const v_5f5d6d = await v_bfb240();
    const v_b785c9 = await v_9639f0(`/oth-path${v_5f5d6d}/warn`, v_b7f2b4, "POST", {});
    v_4d37e3(v_b785c9.status).toBe(200);
    const v_3d8ee5 = (await v_b785c9.json()) as { warningCount: number; suspended: boolean; appliedSuspendDays: number | null };
    v_4d37e3(v_3d8ee5.warningCount).toBe(1);
    v_4d37e3(v_3d8ee5.suspended).toBe(true);
    v_4d37e3(v_3d8ee5.appliedSuspendDays).toBe(7);
    v_4d37e3(await v_3e0055(v_5f5d6d)).toBeTruthy();

    await v_9639f0(`/oth-path`, v_b7f2b4, "PUT", { action: "warn", suspendDays: null });
  });

  v_23805a("규칙 삭제 후 재조회 시 빠짐", async () => {
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    await v_9639f0(`/oth-path`, v_b7f2b4, "PUT", { action: "warn", suspendDays: null });
    let v_8f00b9 = await v_9639f0(`/oth-path`, v_b7f2b4);
    let v_7ecfd1 = (await v_8f00b9.json()) as { items: Array<{ threshold: number }> };
    v_4d37e3(v_7ecfd1.items.some((v_cb35cb) => v_cb35cb.threshold === 9)).toBe(true);

    const v_d0ca5b = await v_9639f0(`/oth-path`, v_b7f2b4, "DELETE");
    v_4d37e3(v_d0ca5b.status).toBe(200);
    v_8f00b9 = await v_9639f0(`/oth-path`, v_b7f2b4);
    v_7ecfd1 = (await v_8f00b9.json()) as { items: Array<{ threshold: number }> };
    v_4d37e3(v_7ecfd1.items.some((v_cb35cb) => v_cb35cb.threshold === 9)).toBe(false);
  });
});
