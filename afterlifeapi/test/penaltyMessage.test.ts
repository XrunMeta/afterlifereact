import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_4ff4a9 = "https://console-preview2.example.invalid";

async function v_0d15aa(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare("SELECT COUNT(*) AS cnt FROM users").first<{ cnt: number }>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

function v_4f6fa9(v_43e90c, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_43e90c}/apply-penalty`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: v_4ff4a9 },
    body: JSON.stringify(v_4d33b2),
  });
}

async function v_566b1d(v_43e90c): Promise<string | null> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(`SELECT body FROM notifications WHERE user_id = ? AND type = 'moderation' ORDER BY id DESC LIMIT 1`)
    .bind(v_43e90c)
    .first<{ body: string }>();
  return v_cb35cb?.body ?? null;
}

v_469bf2("apply-penalty 알림 — 만료일 포함", () => {
  v_ba7107(async () => {
    if (!(await v_0d15aa())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("account_ban 알림 본문에 '까지 계정 사용이 정지됩니다' + 연/월/일", async () => {
    const v_389afb = await v_bfb240("pen-ban@test.local");
    const v_8f00b9 = await v_4f6fa9(v_389afb, { action: "account_ban", suspendDays: 7 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ef175 = await v_566b1d(v_389afb);
    v_4d37e3(v_7ef175).toBeTruthy();
    v_4d37e3(v_7ef175).toContain("까지 계정 사용이 정지됩니다");
    v_4d37e3(v_7ef175).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/);
  });

  v_23805a("clone_create_ban 알림 본문에 '까지 페르소나 생성이 제한됩니다' + 날짜", async () => {
    const v_389afb = await v_bfb240("pen-suspend@test.local");
    const v_8f00b9 = await v_4f6fa9(v_389afb, { action: "clone_create_ban", suspendDays: 30 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ef175 = await v_566b1d(v_389afb);
    v_4d37e3(v_7ef175).toContain("까지 페르소나 생성이 제한됩니다");
    v_4d37e3(v_7ef175).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/);
  });
});
