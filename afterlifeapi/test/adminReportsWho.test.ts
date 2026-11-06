import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_ff107d, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_e6906f = "https://console2.example.invalid";
const v_cafb6f = new URL((v_c9c489 as unknown as { XRUN_API_URL: string }).XRUN_API_URL).origin;
const v_0ad13e = 778;
const v_15552e = "who@xrun.test";

let v_1923e2 = 0;
function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}
function v_b00c75(): D1Database {
  return (v_c9c489 as unknown as { XRUN_DB: D1Database }).XRUN_DB;
}
function v_8fbe51(): string {
  v_1923e2 += 1;
  const v_21cc31 = `aaa.who${Date.now()}x${v_1923e2}.ccc`;
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: "/oth-path", method: "GET", headers: { Authorization: `Bearer ${v_21cc31}` } })
    .reply(200, { success: true, data: { member: v_0ad13e, email: v_15552e, type: 1 } });
  return v_21cc31;
}
function v_b7f2b4(v_9fe22d, v_bfe9b9, v_4d33b2, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { "Content-Type": "application/json", Origin: v_e6906f, "X-Xrun-Admin-Token": v_21cc31 },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}
async function v_bfb240(v_e0c7e8, v_9816e7 = null): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at, xrun_member_id) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, ?)`)
    .bind(v_e0c7e8, v_9816e7)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}
type ReportRow = {
  id: number;
  type: string;
  status: string;
  reviewerAdminId: number | null;
  reviewerEmail: string | null;
  responsibleCommentBanUntil: string | null;
  responsibleInteractionBanUntil: string | null;
  responsibleDeviceBanCount: number;
};

v_ba7107(async () => {
  await v_b00c75().prepare(`CREATE TABLE IF NOT EXISTS admin (member INTEGER PRIMARY KEY, email TEXT)`).run();
  await v_b00c75().prepare(`INSERT OR REPLACE INTO admin (member, email) VALUES (?, ?)`).bind(v_0ad13e, v_15552e).run();
});

v_469bf2("신고 목록 · 제재 이력", () => {
  v_ff107d(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => {
    v_8fd90d.assertNoPendingInterceptors();
    v_8fd90d.deactivate();
  });

  v_23805a("신고 목록에 처리자 이메일과 제재 5종이 나옴 — 세 신고 종류 합친 목록에서도", async () => {
    const v_67cd67 = Date.now();
    const v_5f5d6d = await v_bfb240(`who-target-${v_67cd67}@test.local`);
    const v_4e6894 = await v_bfb240(`who-reporter-${v_67cd67}@test.local`);
    await v_a1651b()
      .prepare(`UPDATE users SET comment_ban_until = datetime('now','+7 days'), interaction_ban_until = datetime('now','+3 days') WHERE id = ?`)
      .bind(v_5f5d6d)
      .run();
    await v_a1651b().prepare(`INSERT INTO device_bans (device_id, banned_user_id, admin_id, reason) VALUES (?, ?, ?, 'x')`).bind(`who-dev-${v_67cd67}`, v_5f5d6d, v_0ad13e).run();
    await v_a1651b().prepare(`INSERT INTO user_reports (reporter_id, target_id, reason) VALUES (?, ?, 'spam')`).bind(v_4e6894, v_5f5d6d).run();
    const v_d5e9c2 = (await v_a1651b().prepare(`SELECT id FROM user_reports WHERE reporter_id = ?`).bind(v_4e6894).first<{ id: number }>())!.id;

    const v_21cc31 = v_8fbe51();
    const v_e98932 = (await (await v_b7f2b4(`/reports?responsibleUserId=${v_5f5d6d}`, "GET", undefined, v_21cc31)).json()) as { items: ReportRow[] };
    v_4d37e3(v_e98932.items).toHaveLength(1);
    v_4d37e3(v_e98932.items[0]).toMatchObject({ reviewerAdminId: null, reviewerEmail: null, responsibleDeviceBanCount: 1 });
    v_4d37e3(v_e98932.items[0]!.responsibleCommentBanUntil).toBeTruthy();
    v_4d37e3(v_e98932.items[0]!.responsibleInteractionBanUntil).toBeTruthy();

    v_4d37e3((await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "reviewed" }, v_21cc31)).status).toBe(200);
    const v_33efc5 = (await (await v_b7f2b4(`/reports?responsibleUserId=${v_5f5d6d}`, "GET", undefined, v_21cc31)).json()) as { items: ReportRow[] };
    v_4d37e3(v_33efc5.items[0]).toMatchObject({ reviewerAdminId: v_0ad13e, reviewerEmail: v_15552e, status: "reviewed" });

    for (const v_3b27d9 of ["clone", "user", "comment"]) {
      v_4d37e3((await v_b7f2b4(`/reports?type=${v_3b27d9}&limit=1`, "GET", undefined, v_21cc31)).status).toBe(200);
    }
  });

  v_23805a("옛 처리분(번호 0)은 처리자 비어 있음", async () => {
    const v_67cd67 = Date.now();
    const v_5f5d6d = await v_bfb240(`who-old-target-${v_67cd67}@test.local`);
    const v_4e6894 = await v_bfb240(`who-old-reporter-${v_67cd67}@test.local`);
    await v_a1651b()
      .prepare(`INSERT INTO user_reports (reporter_id, target_id, reason, status, reviewed_at, reviewer_admin_id) VALUES (?, ?, 'x', 'reviewed', CURRENT_TIMESTAMP, 0)`)
      .bind(v_4e6894, v_5f5d6d)
      .run();
    const v_8f00b9 = (await (await v_b7f2b4(`/reports?responsibleUserId=${v_5f5d6d}`, "GET", undefined, v_8fbe51())).json()) as { items: ReportRow[] };
    v_4d37e3(v_8f00b9.items[0]).toMatchObject({ reviewerAdminId: 0, reviewerEmail: null });
  });

  v_23805a("회원 요약에 제재 이력 — 제재·신고 수락 경고·페르소나 비활성화/활성화·해제, 최신순, 누가 했는지 포함", async () => {
    const v_67cd67 = Date.now();
    const v_660822 = 800000 + (v_67cd67 % 99999);
    const v_5f5d6d = await v_bfb240(`who-log-${v_67cd67}@test.local`, v_660822);
    const v_4e6894 = await v_bfb240(`who-log-rep-${v_67cd67}@test.local`);
    await v_a1651b()
      .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'C', ?, 'friend', 'public', CURRENT_TIMESTAMP)`)
      .bind(v_5f5d6d, `who_clone_${v_67cd67}`)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare(`SELECT id FROM clones WHERE username = ?`).bind(`who_clone_${v_67cd67}`).first<{ id: number }>())!.id;
    await v_a1651b().prepare(`INSERT INTO user_reports (reporter_id, target_id, reason) VALUES (?, ?, 'spam')`).bind(v_4e6894, v_5f5d6d).run();
    const v_d5e9c2 = (await v_a1651b().prepare(`SELECT id FROM user_reports WHERE reporter_id = ?`).bind(v_4e6894).first<{ id: number }>())!.id;

    const v_21cc31 = v_8fbe51();
    v_4d37e3((await v_b7f2b4(`/oth-path${v_5f5d6d}/apply-penalty`, "POST", { action: "comment_ban", suspendDays: 7 }, v_21cc31)).status).toBe(200);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "reviewed" }, v_21cc31)).status).toBe(200);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_6e0fd3}/disable`, "POST", { reason: "운영정책 위반으로 비활성화합니다" }, v_21cc31)).status).toBe(200);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_6e0fd3}/activate`, "POST", undefined, v_21cc31)).status).toBe(200);
    v_4d37e3((await v_b7f2b4(`/oth-path${v_5f5d6d}/unsuspend`, "POST", undefined, v_21cc31)).status).toBe(200);

    const v_dce0a8 = (await (await v_b7f2b4(`/by-xrun/${v_660822}/summary`, "GET", undefined, v_21cc31)).json()) as {
      penaltyLog: Array<{ action: string; createdAt: string; details: Record<string, unknown> }>;
    };
    v_4d37e3(v_dce0a8.penaltyLog.map((v_1614db) => v_1614db.action)).toEqual([
      "moderation.unsuspend",
      "moderation.clone_activate",
      "moderation.clone_disable",
      "moderation.report_warning",
      "moderation.penalty",
    ]);
    for (const v_1614db of v_dce0a8.penaltyLog) {
      v_4d37e3(v_1614db.details).toMatchObject({ adminId: v_0ad13e, adminEmail: v_15552e });
      v_4d37e3(v_1614db.createdAt).toBeTruthy();
    }
    v_4d37e3(v_dce0a8.penaltyLog[4]!.details).toMatchObject({ penalty: "comment_ban", suspendDays: 7 });
    v_4d37e3(v_dce0a8.penaltyLog[2]!.details).toMatchObject({ cloneId: v_6e0fd3, reason: "운영정책 위반으로 비활성화합니다" });

    const v_3cfdfc = (await (await v_b7f2b4(`/oth-path${v_5f5d6d}/detail`, "GET", undefined, v_21cc31)).json()) as { penaltyLog: Array<{ action: string }> };
    v_4d37e3(v_3cfdfc.penaltyLog.map((v_1614db) => v_1614db.action)).toEqual(v_dce0a8.penaltyLog.map((v_1614db) => v_1614db.action));
  });

  v_23805a("같은 신고를 다시 수락해도 이력은 1건", async () => {
    const v_67cd67 = Date.now();
    const v_5f5d6d = await v_bfb240(`who-once-${v_67cd67}@test.local`);
    const v_4e6894 = await v_bfb240(`who-once-rep-${v_67cd67}@test.local`);
    await v_a1651b().prepare(`INSERT INTO user_reports (reporter_id, target_id, reason) VALUES (?, ?, 'spam')`).bind(v_4e6894, v_5f5d6d).run();
    const v_d5e9c2 = (await v_a1651b().prepare(`SELECT id FROM user_reports WHERE reporter_id = ?`).bind(v_4e6894).first<{ id: number }>())!.id;
    const v_21cc31 = v_8fbe51();
    await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "reviewed" }, v_21cc31);
    await v_b7f2b4(`/oth-path${v_d5e9c2}`, "PATCH", { status: "reviewed" }, v_21cc31);
    const v_f4e98d = await v_a1651b()
      .prepare(`SELECT COUNT(*) AS n FROM activity_logs WHERE user_id = ? AND action = 'moderation.report_warning'`)
      .bind(v_5f5d6d)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(1);
  });
});
