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

v_469bf2("apply-penalty — 페르소나 신고 범위", () => {
  async function v_4d24a9(v_1badb6, v_1833e7): Promise<number> {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_cb35cb = await v_a1651b
      .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility) VALUES (?, ?, ?, 'friend', 'public') RETURNING id`)
      .bind(v_1badb6, v_1833e7, `${v_1833e7}-${v_1badb6}-${Math.random().toString(36).slice(2, 8)}`)
      .first<{ id: number }>();
    return v_cb35cb!.id;
  }
  const v_b6e533 = (v_6e0fd3) =>
    (v_c9c489.DB as unknown as D1Database)
      .prepare(`SELECT deletion_state AS s FROM clones WHERE id = ?`)
      .bind(v_6e0fd3)
      .first<{ s: string }>()
      .then((v_cb35cb) => v_cb35cb?.s);

  v_23805a("clone_delete + reportType=clone → 신고된 페르소나만 삭제, 신고는 reviewed", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("pen-clone-owner@test.local");
    const v_4e6894 = await v_bfb240("pen-clone-reporter@test.local");
    const v_07b1f6 = await v_4d24a9(v_257b90, "reported");
    const v_a9cbf1 = await v_4d24a9(v_257b90, "other");
    const v_f10744 = await v_a1651b
      .prepare(`INSERT INTO clone_reports (user_id, clone_id, reason) VALUES (?, ?, '도용') RETURNING id`)
      .bind(v_4e6894, v_07b1f6)
      .first<{ id: number }>();

    const v_8f00b9 = await v_4f6fa9(v_257b90, { action: "clone_delete", reportId: v_f10744!.id, reportType: "clone" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_b6e533(v_07b1f6)).toBe("soft_deleted");
    v_4d37e3(await v_b6e533(v_a9cbf1)).toBe("active");
    const v_72c7a6 = await v_a1651b.prepare(`SELECT status FROM clone_reports WHERE id = ?`).bind(v_f10744!.id).first<{ status: string }>();
    v_4d37e3(v_72c7a6?.status).toBe("reviewed");
  });

  v_23805a("다른 유저 소유 페르소나 신고로는 적용 안 됨", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("pen-clone-owner2@test.local");
    const v_1c6644 = await v_bfb240("pen-clone-stranger@test.local");
    const v_6e7a7d = await v_4d24a9(v_257b90, "c1");
    const v_757f6e = await v_4d24a9(v_1c6644, "s1");
    const v_f10744 = await v_a1651b
      .prepare(`INSERT INTO clone_reports (user_id, clone_id, reason) VALUES (?, ?, '도용') RETURNING id`)
      .bind(v_257b90, v_6e7a7d)
      .first<{ id: number }>();
    const v_8f00b9 = await v_4f6fa9(v_1c6644, { action: "clone_delete", reportId: v_f10744!.id, reportType: "clone" });
    v_4d37e3(v_8f00b9.status).not.toBe(200);
    v_4d37e3(await v_b6e533(v_757f6e)).toBe("active");
    v_4d37e3(await v_b6e533(v_6e7a7d)).toBe("active");
  });
});
