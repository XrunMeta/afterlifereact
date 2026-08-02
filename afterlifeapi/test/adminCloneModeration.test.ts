import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_d72b33 = 9101;
const v_5c864c = 9102; 
const v_132e4e = "https://console2.example.invalid"; 

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

async function v_5d5cfb(): Promise<string> {
  return v_b2eae5({ sub: v_d72b33, kind: "access", admin: true });
}

async function v_11642f(): Promise<string> {
  return v_b2eae5({ sub: v_5c864c, kind: "access", admin: true });
}

v_ba7107(async () => {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-clonemod@afterlife.test", "hashed-placeholder")
    .run();

  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'moderator', 1)`,
    )
    .bind(v_5c864c, "plainadmin-clonemod@afterlife.test", "hashed-placeholder")
    .run();
});

async function v_4d24a9(v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_257b90 = await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'Owner', CURRENT_TIMESTAMP)`)
    .bind(`${v_556427}-owner@afterlife.test`)
    .run();
  const v_1badb6 = v_257b90.meta.last_row_id as number;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CloneMod', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_38480a(v_6e0fd3) {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  return (await v_a1651b
    .prepare(
      `SELECT deletion_state, deleted_at, soft_deleted_at, admin_suspended_at, admin_suspend_reason
         FROM clones WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .first())! as {
    deletion_state: string;
    deleted_at: string | null;
    soft_deleted_at: string | null;
    admin_suspended_at: string | null;
    admin_suspend_reason: string | null;
  };
}

async function v_b060b2(v_f96a98, v_ca7092): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT COUNT(*) AS cnt FROM decryption_audit_log
        WHERE op = ? AND resource_type = 'clone' AND resource_id = ?`,
    )
    .bind(v_f96a98, String(v_ca7092))
    .first<{ cnt: number }>();
  return v_3ac7e7?.cnt ?? 0;
}

v_469bf2("admin clone moderation (T-203)", () => {
  v_23805a("requireAdmin 브릿지(Origin 화이트리스트, 토큰 없음)로는 disable 거부 — 401", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-bridge-block");
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: { Origin: v_132e4e, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "브릿지 우회 시도 테스트" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("일반 admin 토큰(super_admin 아님)으로는 disable 거부 — 403", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-plain-admin-block");
    const v_21cc31 = await v_11642f();
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "권한 없는 관리자 테스트" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("사유 10자 미만이면 400", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-short-reason");
    const v_21cc31 = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "짧음" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("disable — deletion_state 는 active 유지, admin_suspended_at 만 세팅 + 감사 로그", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-disable-ok");
    const v_21cc31 = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "커뮤니티 가이드라인 위반 신고 다수 접수" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b6e533 = await v_38480a(v_6e0fd3);
    v_4d37e3(v_b6e533.deletion_state).toBe("active"); 
    v_4d37e3(v_b6e533.admin_suspended_at).not.toBeNull();
    v_4d37e3(v_b6e533.admin_suspend_reason).toBe("커뮤니티 가이드라인 위반 신고 다수 접수");
    v_4d37e3(await v_b060b2("disable", v_6e0fd3)).toBe(1);
  });

  v_23805a("disable 멱등 — 이미 중지된 클론 재호출 시 alreadySuspended", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-disable-idempotent");
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };
    const v_4d33b2 = JSON.stringify({ reason: "최초 중지 사유 10자 이상" });
    const v_ea719c = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, { method: "POST", headers: v_68f0aa, body: v_4d33b2 });
    v_4d37e3(v_ea719c.status).toBe(200);
    const v_486a80 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, { method: "POST", headers: v_68f0aa, body: v_4d33b2 });
    v_4d37e3(v_486a80.status).toBe(200);
    const v_d1f370 = await v_486a80.json<{ alreadySuspended?: boolean }>();
    v_4d37e3(v_d1f370.alreadySuspended).toBe(true);
  });

  v_23805a("activate — 중지 해제만 필요한 경우 admin_suspended_at 클리어, deletion_state 는 그대로 active", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-unsuspend");
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };
    await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ reason: "중지 해제 테스트용 사유" }),
    });
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/activate`, {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({}),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b6e533 = await v_38480a(v_6e0fd3);
    v_4d37e3(v_b6e533.deletion_state).toBe("active");
    v_4d37e3(v_b6e533.admin_suspended_at).toBeNull();
    v_4d37e3(v_b6e533.admin_suspend_reason).toBeNull();
    v_4d37e3(await v_b060b2("activate", v_6e0fd3)).toBe(1);
  });

  v_23805a("delete — soft_deleted + deleted_at 동기화(T-201 술어와 정합) + 감사 로그", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-delete-ok");
    const v_21cc31 = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "정책 위반으로 삭제 처리함" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b6e533 = await v_38480a(v_6e0fd3);
    v_4d37e3(v_b6e533.deletion_state).toBe("soft_deleted");
    v_4d37e3(v_b6e533.deleted_at).not.toBeNull();
    v_4d37e3(v_b6e533.soft_deleted_at).not.toBeNull();
    v_4d37e3(await v_b060b2("soft_delete", v_6e0fd3)).toBe(1);
  });

  v_23805a("activate — soft_deleted 복원 시 deleted_at·soft_deleted_at 모두 클리어(T-201 대칭)", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-restore-after-delete");
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };
    await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: v_68f0aa,
      body: JSON.stringify({ reason: "복원 테스트를 위한 임시 삭제" }),
    });
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/activate`, {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ reason: "오조작으로 판단되어 즉시 복구함" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b6e533 = await v_38480a(v_6e0fd3);
    v_4d37e3(v_b6e533.deletion_state).toBe("active");
    v_4d37e3(v_b6e533.deleted_at).toBeNull();
    v_4d37e3(v_b6e533.soft_deleted_at).toBeNull();
  });

  v_23805a("이미 삭제된(soft_deleted) 클론은 disable 호출 시 CONFLICT", async () => {
    const v_6e0fd3 = await v_4d24a9("t203-disable-on-deleted");
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };
    await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: v_68f0aa,
      body: JSON.stringify({ reason: "선행 삭제 처리 테스트용" }),
    });
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/disable`, {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ reason: "삭제된 클론 중지 시도 테스트" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(409);
  });
});
