import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_0d15aa(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT COUNT(*) AS cnt FROM users")
      .first<{ cnt: number }>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_5d1973(v_e0c7e8, v_adc076): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  const v_598405 = await v_54846c(v_adc076);
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8, v_598405)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_45fbb9(v_43e90c, v_b6e533): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `UPDATE users
          SET deletion_state = ?,
              soft_deleted_at = CASE WHEN ? = 'soft_deleted' THEN CURRENT_TIMESTAMP ELSE soft_deleted_at END
        WHERE id = ?`,
    )
    .bind(v_b6e533, v_b6e533, v_43e90c)
    .run();
}

async function v_17defa(v_43e90c): Promise<string> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare("SELECT deletion_state FROM users WHERE id = ?")
    .bind(v_43e90c)
    .first<{ deletion_state: string }>();
  return v_cb35cb!.deletion_state;
}

function v_c34e2f(v_9fe22d, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

const v_8c880b = "Abcdef1";

v_469bf2("auth — soft_deleted 계정 로그인 차단 + 복구", () => {
  v_ba7107(async () => {
    if (!(await v_0d15aa())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("active 계정은 정상 로그인 (200 + accessToken)", async () => {
    const v_e0c7e8 = "del-active@test.local";
    await v_5d1973(v_e0c7e8, v_8c880b);
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { accessToken?: string };
    v_4d37e3(typeof v_7ecfd1.accessToken).toBe("string");
  });

  v_23805a("soft_deleted 계정 로그인 → 403 ACCOUNT_DELETED + restorable=true", async () => {
    const v_e0c7e8 = "del-soft@test.local";
    const v_0c8987 = await v_5d1973(v_e0c7e8, v_8c880b);
    await v_45fbb9(v_0c8987, "soft_deleted");
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_7ecfd1 = (await v_8f00b9.json()) as {
      error: { code: string; details?: { restorable?: boolean } };
    };
    v_4d37e3(v_7ecfd1.error.code).toBe("ACCOUNT_DELETED");
    v_4d37e3(v_7ecfd1.error.details?.restorable).toBe(true);
  });

  v_23805a("soft_deleted + 틀린 비번 → ACCOUNT_DELETED 누설 없이 401 UNAUTHENTICATED", async () => {
    const v_e0c7e8 = "del-soft-wrongpw@test.local";
    const v_0c8987 = await v_5d1973(v_e0c7e8, v_8c880b);
    await v_45fbb9(v_0c8987, "soft_deleted");
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: "WRONGpw9" });
    v_4d37e3(v_8f00b9.status).toBe(401);
    const v_7ecfd1 = (await v_8f00b9.json()) as { error: { code: string } };
    v_4d37e3(v_7ecfd1.error.code).toBe("UNAUTHENTICATED");
  });

  v_23805a("POST /oth-path (email+password) → 복구 + active 전환 + 세션 발급, 이후 로그인 정상", async () => {
    const v_e0c7e8 = "del-restore@test.local";
    const v_0c8987 = await v_5d1973(v_e0c7e8, v_8c880b);
    await v_45fbb9(v_0c8987, "soft_deleted");

    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { ok: boolean; state: string; accessToken?: string };
    v_4d37e3(v_7ecfd1.ok).toBe(true);
    v_4d37e3(v_7ecfd1.state).toBe("active");
    v_4d37e3(typeof v_7ecfd1.accessToken).toBe("string");
    v_4d37e3(await v_17defa(v_0c8987)).toBe("active");

    const v_182fdb = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_182fdb.status).toBe(200);
  });

  v_23805a("POST /oth-path 틀린 비번 → 401, 복구 안 됨 (여전히 soft_deleted)", async () => {
    const v_e0c7e8 = "del-restore-bad@test.local";
    const v_0c8987 = await v_5d1973(v_e0c7e8, v_8c880b);
    await v_45fbb9(v_0c8987, "soft_deleted");
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: "WRONGpw9" });
    v_4d37e3(v_8f00b9.status).toBe(401);
    v_4d37e3(await v_17defa(v_0c8987)).toBe("soft_deleted");
  });

  v_23805a("POST /oth-path 이미 active 계정 → 멱등 (200, 그대로 active)", async () => {
    const v_e0c7e8 = "del-restore-idem@test.local";
    const v_0c8987 = await v_5d1973(v_e0c7e8, v_8c880b);
    const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_17defa(v_0c8987)).toBe("active");
  });
});
