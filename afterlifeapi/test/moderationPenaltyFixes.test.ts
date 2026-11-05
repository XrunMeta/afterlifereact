import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_115660 } from "../src/lib/adminWithdrawal";
import { v_f45eef, v_5bb199 } from "../src/lib/penaltyGate";
import { v_3ebe58 } from "../src/lib/errors";

const v_4ff4a9 = "https://console-preview2.example.invalid";
const v_8c880b = "Abcdef1";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(v_e0c7e8, v_adc076 = v_8c880b): Promise<number> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, await v_54846c(v_adc076))
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

function v_c34e2f(v_9fe22d, v_4d33b2, v_3f4675 = {}): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...v_3f4675 },
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

async function v_f08ebe(v_389afb): Promise<string | null> {
  return (await v_a1651b().prepare(`SELECT admin_withdrawn_at AS at FROM users WHERE id = ?`).bind(v_389afb).first<{ at: string | null }>())?.at ?? null;
}

v_469bf2("제재 프리셋 — 11종 모두 저장", () => {
  v_23805a("예전엔 CHECK 위반이던 6종도 PUT 200 + 조회", async () => {
    const v_dd943a = ["account_withdraw", "comment_ban", "interaction_ban", "force_logout", "notify_only", "device_ban"];
    for (const [v_ebec57, v_9b064f] of v_dd943a.entries()) {
      const v_d361d7 = 90 + v_ebec57;
      const v_6a53fd = v_9b064f === "comment_ban" || v_9b064f === "interaction_ban" ? 7 : null;
      const v_4abc91 = await v_b7f2b4(`/report-penalty-rules/${v_d361d7}`, "PUT", { action: v_9b064f, suspendDays: v_6a53fd, title: `t-${v_9b064f}` });
      v_4d37e3(v_4abc91.status, v_9b064f).toBe(200);
    }
    const v_ef8ab1 = (await (await v_b7f2b4(`/report-penalty-rules`, "GET")).json()) as { items: Array<{ threshold: number; action: string }> };
    for (const [v_ebec57, v_9b064f] of v_dd943a.entries()) {
      v_4d37e3(v_ef8ab1.items.find((v_cb35cb) => v_cb35cb.threshold === 90 + v_ebec57)?.action).toBe(v_9b064f);
    }
    for (let v_ebec57 = 0; v_ebec57 < v_dd943a.length; v_ebec57++) await v_b7f2b4(`/report-penalty-rules/${90 + v_ebec57}`, "DELETE");
  });
});

v_469bf2("관리자 강제 탈퇴 — 실제로 유지", () => {
  v_ba7107(async () => {
    const v_cb35cb = await v_a1651b().prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>();
    if (typeof v_cb35cb?.c !== "number") throw new Error("D1 migrations not applied.");
  });

  v_23805a("쓰던 access 토큰·refresh 모두 거절, 부활 게이트 표식, 취소하면 해제", async () => {
    const v_e0c7e8 = `withdraw-${Date.now()}@test.local`;
    const v_389afb = await v_bfb240(v_e0c7e8);
    const v_182fdb = (await (await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b })).json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const v_b32680 = () => v_1df298.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${v_182fdb.accessToken}` } });
    v_4d37e3((await v_b32680()).status).toBe(200);

    const v_8f00b9 = await v_b7f2b4(`/oth-path${v_389afb}/apply-penalty`, "POST", { action: "account_withdraw" });
    v_4d37e3(v_8f00b9.status).toBe(200);

    v_4d37e3((await v_b32680()).status).toBe(401);

    const v_1a1b9b = await v_c34e2f("/oth-path", { refreshToken: v_182fdb.refreshToken });
    v_4d37e3(v_1a1b9b.status).toBe(401);

    v_4d37e3(await v_f08ebe(v_389afb)).toBeTruthy();
    await v_4d37e3(v_115660(v_a1651b(), v_389afb)).rejects.toMatchObject({ code: "ACCOUNT_DELETED" });

    v_4d37e3((await v_b7f2b4(`/oth-path${v_389afb}/lift-penalty`, "POST", { action: "account_restore" })).status).toBe(200);
    v_4d37e3(await v_f08ebe(v_389afb)).toBeNull();
    await v_4d37e3(v_115660(v_a1651b(), v_389afb)).resolves.toBeUndefined();
    v_4d37e3((await v_c34e2f("/oth-path", { email: v_e0c7e8, password: v_8c880b })).status).toBe(200);
  });

  v_23805a("본인 탈퇴(표식 없음)는 게이트를 통과 — 기존 재로그인 부활 그대로", async () => {
    const v_389afb = await v_bfb240(`self-del-${Date.now()}@test.local`);
    await v_a1651b().prepare(`UPDATE users SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(v_389afb).run();
    await v_4d37e3(v_115660(v_a1651b(), v_389afb)).resolves.toBeUndefined();
  });
});

v_469bf2("댓글 금지 / 좋아요·팔로우 금지 — 전용 코드", () => {
  v_23805a("기한 안이면 COMMENT_BANNED / INTERACTION_BANNED (403), 만료되면 통과", async () => {
    const v_389afb = await v_bfb240(`ban-codes-${Date.now()}@test.local`);
    await v_a1651b()
      .prepare(`UPDATE users SET comment_ban_until = datetime('now', '+7 days'), interaction_ban_until = datetime('now', '+7 days') WHERE id = ?`)
      .bind(v_389afb)
      .run();
    const v_3f4e2e = await v_f45eef(v_a1651b() as never, v_389afb).catch((v_9e86fd) => v_9e86fd);
    v_4d37e3(v_3f4e2e).toBeInstanceOf(v_3ebe58);
    v_4d37e3((v_3f4e2e as v_3ebe58).code).toBe("COMMENT_BANNED");
    const v_ebec57 = await v_5bb199(v_a1651b() as never, v_389afb).catch((v_9e86fd) => v_9e86fd);
    v_4d37e3((v_ebec57 as v_3ebe58).code).toBe("INTERACTION_BANNED");

    await v_a1651b()
      .prepare(`UPDATE users SET comment_ban_until = datetime('now', '-1 days'), interaction_ban_until = NULL WHERE id = ?`)
      .bind(v_389afb)
      .run();
    await v_4d37e3(v_f45eef(v_a1651b() as never, v_389afb)).resolves.toBeUndefined();
    await v_4d37e3(v_5bb199(v_a1651b() as never, v_389afb)).resolves.toBeUndefined();
  });
});
