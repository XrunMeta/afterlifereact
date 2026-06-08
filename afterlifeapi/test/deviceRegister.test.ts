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

async function v_bfb240(v_e0c7e8, v_adc076): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  const v_598405 = await v_54846c(v_adc076);
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_598405)
    .run();
}

async function v_182fdb(v_e0c7e8, v_adc076): Promise<string> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: v_adc076 }),
  });
  const v_7ecfd1 = (await v_8f00b9.json()) as { accessToken?: string };
  return v_7ecfd1.accessToken!;
}

function v_bac493(v_21cc31, v_4d33b2): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_21cc31}` },
    body: JSON.stringify(v_4d33b2),
  });
}

const v_8c880b = "Abcdef1";

v_469bf2("POST /oth-path — push_token 부분 unique 충돌 방지", () => {
  v_ba7107(async () => {
    if (!(await v_0d15aa())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("같은 토큰을 다른 device_id 로 재등록해도 500 없이 200, 이전 행은 비활성화", async () => {
    const v_e0c7e8 = "device-reuse@test.local";
    await v_bfb240(v_e0c7e8, v_8c880b);
    const v_21cc31 = await v_182fdb(v_e0c7e8, v_8c880b);
    const v_1a29d0 = "ExponentPushToken[reuse-xyz-123]";

    const v_2d1eeb = await v_bac493(v_21cc31, { deviceId: "dev-A", pushToken: v_1a29d0, platform: "android" });
    v_4d37e3(v_2d1eeb.status).toBe(200);

    const v_b96973 = await v_bac493(v_21cc31, { deviceId: "dev-B", pushToken: v_1a29d0, platform: "android" });
    v_4d37e3(v_b96973.status).toBe(200);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_f8b770 = await v_a1651b
      .prepare(`SELECT device_id FROM user_devices WHERE push_token = ? AND is_active = 1`)
      .bind(v_1a29d0)
      .all<{ device_id: string }>();

    v_4d37e3(v_f8b770.results.map((v_cb35cb) => v_cb35cb.device_id)).toEqual(["dev-B"]);
  });

  v_23805a("필수 필드 누락 시 400 VALIDATION_FAILED", async () => {
    const v_e0c7e8 = "device-missing@test.local";
    await v_bfb240(v_e0c7e8, v_8c880b);
    const v_21cc31 = await v_182fdb(v_e0c7e8, v_8c880b);
    const v_8f00b9 = await v_bac493(v_21cc31, { deviceId: "x" });
    v_4d37e3(v_8f00b9.status).toBe(422); 
  });
});
