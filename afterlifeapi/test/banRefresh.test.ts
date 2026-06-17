import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_0d15aa(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare("SELECT COUNT(*) AS cnt FROM users").first<{ cnt: number }>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_bfb240(v_e0c7e8, v_adc076): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  const v_598405 = await v_54846c(v_adc076);
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_598405)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_ec770c(v_43e90c): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`UPDATE users SET banned_until = datetime('now', '+30 days') WHERE id = ?`)
    .bind(v_43e90c)
    .run();
}

function v_c34e2f(v_9fe22d, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

const v_8c880b = "Abcdef1";

v_469bf2("auth — 계정 사용 금지(account_ban) 활성 세션 무효화", () => {
  v_ba7107(async () => {
    if (!(await v_0d15aa())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("ban 적용 후 리프레시 토큰 갱신 → 403 ACCOUNT_SUSPENDED", async () => {
    const v_e0c7e8 = "ban-refresh@test.local";
    const v_389afb = await v_bfb240(v_e0c7e8, v_8c880b);

    const v_445b40 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_445b40.status).toBe(200);
    const v_182fdb = (await v_445b40.json()) as { refreshToken?: string };
    v_4d37e3(typeof v_182fdb.refreshToken).toBe("string");

    const v_3ed4c3 = await v_c34e2f("/oth-path", { refreshToken: v_182fdb.refreshToken });
    v_4d37e3(v_3ed4c3.status).toBe(200);
    const v_b049b0 = (await v_3ed4c3.json()) as { refreshToken?: string };
    v_4d37e3(typeof v_b049b0.refreshToken).toBe("string");

    await v_ec770c(v_389afb);

    const v_3bebca = await v_c34e2f("/oth-path", { refreshToken: v_b049b0.refreshToken });
    v_4d37e3(v_3bebca.status).toBe(403);
    const v_4d33b2 = (await v_3bebca.json()) as { error?: { code?: string } };
    v_4d37e3(v_4d33b2.error?.code).toBe("ACCOUNT_SUSPENDED");
  });

  v_23805a("ban 적용 후 신규 로그인도 403 ACCOUNT_SUSPENDED", async () => {
    const v_e0c7e8 = "ban-login@test.local";
    const v_389afb = await v_bfb240(v_e0c7e8, v_8c880b);
    await v_ec770c(v_389afb);
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = (await v_8f00b9.json()) as { error?: { code?: string } };
    v_4d37e3(v_4d33b2.error?.code).toBe("ACCOUNT_SUSPENDED");
  });
});
