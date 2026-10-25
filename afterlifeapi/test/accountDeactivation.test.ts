

import { v_469bf2, v_23805a, v_4d37e3, v_3889c0 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_8c880b = "Abcdef1";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, await v_54846c(v_8c880b))
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

function v_4f438a(v_9fe22d, v_4d33b2, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(v_21cc31 ? { Authorization: `Bearer ${v_21cc31}` } : {}) },
    body: JSON.stringify(v_4d33b2),
  });
}

async function v_182fdb(v_e0c7e8) {
  return v_4f438a("/oth-path", { email: v_e0c7e8, password: v_8c880b });
}

v_469bf2("계정 비활성화", () => {
  v_23805a("비밀번호 인증 → 비활성화 · 옛 토큰 거부 · 로그인 시 활성화 토큰 · 활성화 후 정상", async () => {
    const v_e0c7e8 = "deact-a@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const { accessToken: v_2ca7e0 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };

    v_4d37e3((await v_4f438a("/oth-path", { password: "Wrong999" }, v_2ca7e0)).status).toBe(422);

    const v_8f00b9 = await v_4f438a("/oth-path", { password: v_8c880b }, v_2ca7e0);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_a1651b().prepare("SELECT deactivated_at FROM users WHERE id = ?").bind(v_0c8987)
      .first<{ deactivated_at: string | null }>();
    v_4d37e3(v_3ac7e7!.deactivated_at).not.toBeNull();

    const v_b32680 = await v_1df298.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${v_2ca7e0}` } });
    v_4d37e3(v_b32680.status).toBe(401);

    const v_826279 = await v_182fdb(v_e0c7e8);
    v_4d37e3(v_826279.status).toBe(403);
    const v_49263d = (await v_826279.json()) as { error: { code: string; details?: { reactivateToken?: string } } };
    v_4d37e3(v_49263d.error.code).toBe("ACCOUNT_DEACTIVATED");
    const v_801c01 = v_49263d.error.details!.reactivateToken!;
    v_4d37e3(v_801c01.length).toBeGreaterThan(20);

    const v_d95200 = await v_4f438a("/oth-path", { reactivateToken: v_801c01 });
    v_4d37e3(v_d95200.status).toBe(200);
    const v_ef86b6 = (await v_d95200.json()) as { accessToken: string };
    const v_c9a814 = await v_1df298.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${v_ef86b6.accessToken}` } });
    v_4d37e3(v_c9a814.status).toBe(200);
    const v_33efc5 = await v_a1651b().prepare("SELECT deactivated_at FROM users WHERE id = ?").bind(v_0c8987)
      .first<{ deactivated_at: string | null }>();
    v_4d37e3(v_33efc5!.deactivated_at).toBeNull();
    v_4d37e3((await v_182fdb(v_e0c7e8)).status).toBe(200);
  });

  v_23805a("비활성화 중엔 내 클론이 홈피드에서 숨고 알림이 쌓이지 않는다", async () => {
    const v_1badb6 = await v_bfb240("deact-b@test.local");
    await v_a1651b()
      .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
                VALUES (?, 'DeactClone', 'deact_clone_b', 'friend', 'public', CURRENT_TIMESTAMP)`)
      .bind(v_1badb6)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare("SELECT id FROM clones WHERE username = 'deact_clone_b'").first<{ id: number }>())!.id;
    const v_d0d339 = async () =>
      ((await (await v_1df298.fetch("http://localhost/oth-path?limit=50")).json()) as {
        items?: Array<{ cloneId: number }>;
      }).items ?? [];
    v_4d37e3((await v_d0d339()).some((v_ebec57) => v_ebec57.cloneId === v_6e0fd3)).toBe(true);

    await v_a1651b().prepare("UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_1badb6).run();
    v_4d37e3((await v_d0d339()).some((v_ebec57) => v_ebec57.cloneId === v_6e0fd3)).toBe(false);

    const { notify: v_c226a5 } = await import("../src/lib/notify");
    await v_c226a5(v_c9c489 as never, { userId: v_1badb6, type: "system", title: "t", body: "b" } as never);
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?").bind(v_1badb6)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });
});

v_469bf2("계정 비활성화 후속 보강", () => {
  async function v_207351(v_e0c7e8, v_2ca7e0): Promise<string> {
    v_4d37e3((await v_4f438a("/oth-path", { password: v_8c880b }, v_2ca7e0)).status).toBe(200);
    const v_49263d = (await (await v_182fdb(v_e0c7e8)).json()) as { error: { details?: { reactivateToken?: string } } };
    return v_49263d.error.details!.reactivateToken!;
  }

  v_23805a("재활성화 후에도 KV 표식이 남아 옛 토큰은 stale · 새 토큰은 통과", async () => {
    const { isTokenEpochStale: v_d5996b } = await import("../src/lib/deactivation");
    const v_e0c7e8 = "deact-c@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const { accessToken: v_79ea88 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };
    const v_ef84a7 = (await v_a1651b().prepare("SELECT session_epoch AS ep FROM users WHERE id = ?").bind(v_0c8987).first<{ ep: number }>())!.ep;
    const v_801c01 = await v_207351(v_e0c7e8, v_79ea88);
    const v_d95200 = await v_4f438a("/oth-path", { reactivateToken: v_801c01 });
    v_4d37e3(v_d95200.status).toBe(200);
    const { accessToken: v_4094c3 } = (await v_d95200.json()) as { accessToken: string };

    v_4d37e3(await v_c9c489.KV_AUTH.get(`uepoch:${v_0c8987}`)).not.toBeNull();
    v_4d37e3(await v_d5996b(v_c9c489 as never, v_0c8987, v_ef84a7)).toBe(true);
    const v_c3bc75 = (await v_a1651b().prepare("SELECT session_epoch AS ep FROM users WHERE id = ?").bind(v_0c8987).first<{ ep: number }>())!.ep;
    v_4d37e3(await v_d5996b(v_c9c489 as never, v_0c8987, v_c3bc75)).toBe(false);

    const v_38715b = (v_8d41d7) => v_1df298.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${v_8d41d7}` } });
    v_4d37e3((await v_38715b(v_79ea88)).status).toBe(401);
    v_4d37e3((await v_38715b(v_4094c3)).status).toBe(200);
  });

  v_23805a("같은 reactivateToken 두 번째 사용은 UNAUTHENTICATED", async () => {
    const v_e0c7e8 = "deact-d@test.local";
    await v_bfb240(v_e0c7e8);
    const { accessToken: v_2ca7e0 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };
    const v_801c01 = await v_207351(v_e0c7e8, v_2ca7e0);
    v_4d37e3((await v_4f438a("/oth-path", { reactivateToken: v_801c01 })).status).toBe(200);
    v_4d37e3((await v_4f438a("/oth-path", { reactivateToken: v_801c01 })).status).toBe(401);
  });

  v_23805a("토큰 A 발급(미소비) 후 재비활성화(epoch+1)되면 A 로 복구 불가", async () => {
    const { logoutAllDevices: v_1186b8 } = await import("../src/lib/deactivation");
    const v_e0c7e8 = "deact-e@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const { accessToken: v_2ca7e0 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };
    const v_706f17 = await v_207351(v_e0c7e8, v_2ca7e0); 

    await v_a1651b().prepare("UPDATE users SET deactivated_at = NULL WHERE id = ?").bind(v_0c8987).run();
    await v_1186b8(v_c9c489 as never, v_0c8987);
    await v_a1651b().prepare("UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_0c8987).run();
    v_4d37e3((await v_4f438a("/oth-path", { reactivateToken: v_706f17 })).status).toBe(401);
    const v_3ac7e7 = await v_a1651b().prepare("SELECT deactivated_at FROM users WHERE id = ?").bind(v_0c8987).first<{ deactivated_at: string | null }>();
    v_4d37e3(v_3ac7e7!.deactivated_at).not.toBeNull();

    const v_49263d = (await (await v_182fdb(v_e0c7e8)).json()) as { error: { details?: { reactivateToken?: string } } };
    v_4d37e3((await v_4f438a("/oth-path", { reactivateToken: v_49263d.error.details!.reactivateToken! })).status).toBe(200);
  });

  v_23805a("정지(banned_until)된 계정은 유효한 reactivateToken 으로도 복구 불가", async () => {
    const v_e0c7e8 = "deact-h@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const { accessToken: v_2ca7e0 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };
    const v_21cc31 = await v_207351(v_e0c7e8, v_2ca7e0);
    await v_a1651b().prepare("UPDATE users SET banned_until = datetime('now', '+30 days') WHERE id = ?").bind(v_0c8987).run();
    const v_8f00b9 = await v_4f438a("/oth-path", { reactivateToken: v_21cc31 });
    v_4d37e3(v_8f00b9.status).toBe(403);
    v_4d37e3(((await v_8f00b9.json()) as { error: { code: string } }).error.code).toBe("ACCOUNT_SUSPENDED");
    const v_3ac7e7 = await v_a1651b().prepare("SELECT deactivated_at FROM users WHERE id = ?").bind(v_0c8987).first<{ deactivated_at: string | null }>();
    v_4d37e3(v_3ac7e7!.deactivated_at).not.toBeNull();
  });

  v_23805a("ep 클레임 없는 옛 reactivateToken 은 거부", async () => {
    const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
    const v_0c8987 = await v_bfb240("deact-f@test.local");
    await v_a1651b().prepare("UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_0c8987).run();
    const v_8d41d7 = await v_b2eae5({ sub: v_0c8987, kind: "reactivate" }, (v_c9c489 as never as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 600);
    v_4d37e3((await v_4f438a("/oth-path", { reactivateToken: v_8d41d7 })).status).toBe(401);
  });

  v_23805a("KV put 실패 시 /me/deactivate 는 실패하고 deactivated_at 은 NULL 로 남는다", async () => {
    const v_e0c7e8 = "deact-g@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    const { accessToken: v_2ca7e0 } = (await (await v_182fdb(v_e0c7e8)).json()) as { accessToken: string };
    const v_980ff2 = v_3889c0.spyOn(v_c9c489.KV_AUTH, "put").mockRejectedValue(new Error("kv down"));
    try {
      const v_8f00b9 = await v_4f438a("/oth-path", { password: v_8c880b }, v_2ca7e0);
      v_4d37e3(v_980ff2).toHaveBeenCalled(); 
      v_4d37e3(v_8f00b9.status).toBeGreaterThanOrEqual(500);
    } finally {
      v_980ff2.mockRestore();
    }
    const v_3ac7e7 = await v_a1651b().prepare("SELECT deactivated_at FROM users WHERE id = ?").bind(v_0c8987).first<{ deactivated_at: string | null }>();
    v_4d37e3(v_3ac7e7!.deactivated_at).toBeNull();
  });
});
