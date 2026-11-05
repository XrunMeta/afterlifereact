import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_4ff4a9 = "https://console-preview2.example.invalid";
const v_8c880b = "Abcdef1";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, await v_54846c(v_8c880b))
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

function v_c34e2f(v_9fe22d, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

function v_b7f2b4(v_9fe22d, v_bfe9b9, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { "Content-Type": "application/json", Origin: v_4ff4a9 },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

async function v_182fdb(v_e0c7e8, v_929b58): Promise<{ accessToken: string; refreshToken: string }> {
  const v_8f00b9 = await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b, ...(v_929b58 ? { deviceId: v_929b58 } : {}) });
  v_4d37e3(v_8f00b9.status, `login ${v_e0c7e8}`).toBe(200);
  return (await v_8f00b9.json()) as { accessToken: string; refreshToken: string };
}

function v_b32680(v_21cc31): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${v_21cc31}` } });
}

async function v_c8b83f(v_389afb, v_a19934): Promise<string | null> {
  return (await v_a1651b().prepare(`SELECT ${v_a19934} AS v FROM users WHERE id = ?`).bind(v_389afb).first<{ v: string | null }>())?.v ?? null;
}

v_469bf2("정지 재적용 — 더 긴 기존 기간 유지", () => {
  v_23805a("1년 정지 위에 7일 정지를 걸어도 1년 유지, 없던 제재는 새로 걸림", async () => {
    const v_389afb = await v_bfb240(`extend-${Date.now()}@test.local`);
    await v_a1651b()
      .prepare(`UPDATE users SET banned_until = datetime('now', '+365 days'), suspended_until = '2099-01-01T00:00:00.000Z' WHERE id = ?`)
      .bind(v_389afb)
      .run();
    const v_e98932 = await v_c8b83f(v_389afb, "banned_until");

    v_4d37e3((await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "account_ban", suspendDays: 7 })).status).toBe(200);
    v_4d37e3(await v_c8b83f(v_389afb, "banned_until")).toBe(v_e98932);

    v_4d37e3((await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "clone_create_ban", suspendDays: 7 })).status).toBe(200);
    v_4d37e3(await v_c8b83f(v_389afb, "suspended_until")).toBe("2099-01-01 00:00:00");

    v_4d37e3((await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "comment_ban", suspendDays: 7 })).status).toBe(200);
    const v_16dbdb = await v_c8b83f(v_389afb, "comment_ban_until");
    const v_6a53fd = (Date.parse(v_16dbdb!.replace(" ", "T") + "Z") - Date.now()) / 86400000;
    v_4d37e3(v_6a53fd).toBeGreaterThan(6.9);
    v_4d37e3(v_6a53fd).toBeLessThan(7.1);
  });
});

v_469bf2("댓글 신고 경고 — 1회만", () => {
  v_23805a("제재 적용으로 신고가 처리 완료되고, 이후 [수락]해도 경고가 늘지 않음", async () => {
    const v_67cd67 = Date.now();
    const v_abe745 = await v_bfb240(`cm-author-${v_67cd67}@test.local`);
    const v_4e6894 = await v_bfb240(`cm-reporter-${v_67cd67}@test.local`);
    await v_a1651b()
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'CmClone', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
      )
      .bind(v_4e6894, `cm_clone_${v_67cd67}`)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare(`SELECT id FROM clones WHERE username = ?`).bind(`cm_clone_${v_67cd67}`).first<{ id: number }>())!.id;
    await v_a1651b().prepare(`INSERT INTO feeds (clone_id, content, created_at) VALUES (?, 'post', CURRENT_TIMESTAMP)`).bind(v_6e0fd3).run();
    const v_c09aa8 = (await v_a1651b().prepare(`SELECT id FROM feeds WHERE clone_id = ?`).bind(v_6e0fd3).first<{ id: number }>())!.id;
    await v_a1651b().prepare(`INSERT INTO feed_comments (feed_id, user_id, content) VALUES (?, ?, 'bad')`).bind(v_c09aa8, v_abe745).run();
    const v_d91518 = (await v_a1651b().prepare(`SELECT id FROM feed_comments WHERE user_id = ?`).bind(v_abe745).first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare(`INSERT INTO comment_reports (user_id, comment_id, feed_id, clone_id, reason) VALUES (?, ?, ?, ?, 'spam')`)
      .bind(v_4e6894, v_d91518, v_c09aa8, v_6e0fd3)
      .run();
    const v_99000e = (await v_a1651b().prepare(`SELECT id FROM comment_reports WHERE comment_id = ?`).bind(v_d91518).first<{ id: number }>())!.id;
    const v_d01889 = async () =>
      (await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`).bind(v_abe745).first<{ n: number }>())!.n;

    v_4d37e3(
      (await v_b7f2b4(`/oth-path${v_4e6894}/apply-penalty`, "POST", { action: "warn", reportId: v_99000e, reportType: "comment" })).status,
    ).toBe(422);

    const v_8f00b9 = await v_b7f2b4(`/oth-path${v_abe745}/apply-penalty`, "POST", { action: "warn", reportId: v_99000e, reportType: "comment" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_d01889()).toBe(1);
    const v_f10744 = await v_a1651b().prepare(`SELECT status, reporter_message AS rm FROM comment_reports WHERE id = ?`).bind(v_99000e).first<{ status: string; rm: string | null }>();
    v_4d37e3(v_f10744?.status).toBe("reviewed");
    v_4d37e3(v_f10744?.rm).toContain("경고 발급");

    v_4d37e3((await v_b7f2b4(`/comments/reports/${v_99000e}`, "PATCH", { status: "reviewed" })).status).toBe(200);
    v_4d37e3(await v_d01889()).toBe(1);
  });
});

v_469bf2("강제 로그아웃 — 즉시", () => {
  v_23805a("쓰던 토큰 바로 401, refresh 는 SESSION_REVOKED", async () => {
    const v_e0c7e8 = `fl-${Date.now()}@test.local`;
    const v_389afb = await v_bfb240(v_e0c7e8);
    const v_fd5f43 = await v_182fdb(v_e0c7e8);
    v_4d37e3((await v_b32680(v_fd5f43.accessToken)).status).toBe(200);

    v_4d37e3((await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "force_logout" })).status).toBe(200);
    v_4d37e3((await v_b32680(v_fd5f43.accessToken)).status).toBe(401);
    const v_cb35cb = await v_c34e2f("/oth-path", { refreshToken: v_fd5f43.refreshToken });
    v_4d37e3(v_cb35cb.status).toBe(401);
    v_4d37e3(((await v_cb35cb.json()) as { error: { code: string } }).error.code).toBe("SESSION_REVOKED");

    await v_182fdb(v_e0c7e8);
  });
});

v_469bf2("기기 차단", () => {
  v_23805a("푸시 없이 로그인만 한 기기도 차단 · 같은 기기 다른 계정도 거절 · 해제하면 다시 로그인", async () => {
    const v_67cd67 = Date.now();
    const v_ac8c13 = `dev-${v_67cd67}`;
    const v_aed29f = `db-a-${v_67cd67}@test.local`;
    const v_1c8bb8 = `db-b-${v_67cd67}@test.local`;
    const v_779914 = await v_bfb240(v_aed29f);
    await v_bfb240(v_1c8bb8);
    const v_89cd1b = await v_182fdb(v_aed29f, v_ac8c13);
    const v_138fc0 = await v_182fdb(v_1c8bb8, v_ac8c13);

    v_4d37e3((await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM user_devices WHERE user_id = ?`).bind(v_779914).first<{ n: number }>())!.n).toBe(0);

    const v_8f00b9 = await v_b7f2b4(`/oth-path${v_779914}/apply-penalty`, "POST", { action: "device_ban" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3((await v_a1651b().prepare(`SELECT banned_user_id AS u FROM device_bans WHERE device_id = ?`).bind(v_ac8c13).first<{ u: number }>())?.u).toBe(v_779914);

    v_4d37e3((await v_b32680(v_89cd1b.accessToken)).status).toBe(401);
    v_4d37e3((await v_c34e2f("/oth-path", { email: v_aed29f, password: v_8c880b, deviceId: v_ac8c13 })).status).toBe(401);

    const v_90e603 = await v_c34e2f("/oth-path", { refreshToken: v_138fc0.refreshToken });
    v_4d37e3(v_90e603.status).toBe(401);
    v_4d37e3(((await v_90e603.json()) as { error: { code: string; message: string } }).error.message).toContain("기기");

    await v_a1651b().prepare(`UPDATE users SET xrun_member_id = ? WHERE id = ?`).bind(900000 + (v_67cd67 % 99999), v_779914).run();
    const v_dce0a8 = (await (await v_b7f2b4(`/by-xrun/${900000 + (v_67cd67 % 99999)}/summary`, "GET")).json()) as {
      user: { deviceBanCount: number };
    };
    v_4d37e3(v_dce0a8.user.deviceBanCount).toBe(1);

    const v_ff7453 = await v_b7f2b4(`/oth-path${v_779914}/unsuspend`, "POST");
    v_4d37e3(v_ff7453.status).toBe(200);
    v_4d37e3(((await v_ff7453.json()) as { deviceBansLifted: number }).deviceBansLifted).toBe(1);
    await v_182fdb(v_aed29f, v_ac8c13);
  });

  v_23805a("쓴 기기 기록이 없으면 실패로 돌려주고 알림도 안 감", async () => {
    const v_389afb = await v_bfb240(`db-none-${Date.now()}@test.local`);
    const v_8f00b9 = await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "device_ban" });
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_f4e98d = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?`).bind(v_389afb).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });
});
