import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_d72b33 = 9111;

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_38cec9(v_ddc5a4): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_ddc5a4, v_43fd42, 600);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_62bb46(v_43e90c, v_9b064f): Promise<Record<string, unknown> | null> {
  const v_3ac7e7 = await v_a1651b()
    .prepare(`SELECT details FROM activity_logs WHERE user_id = ? AND action = ? ORDER BY id DESC LIMIT 1`)
    .bind(v_43e90c, v_9b064f)
    .first<{ details: string | null }>();
  return v_3ac7e7?.details ? (JSON.parse(v_3ac7e7.details) as Record<string, unknown>) : null;
}

function v_51c3d2(v_bfe9b9, v_9fe22d, v_21cc31, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

v_ba7107(async () => {
  await v_a1651b()
    .prepare(
      `INSERT OR REPLACE INTO admin_users (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-clonelog@afterlife.test", "hashed-placeholder")
    .run();
});

v_469bf2("클론 삭제·복구 시스템 로그", () => {
  v_23805a("사용자 삭제(공동관리자 없음) → clone.delete soft_deleted, 복구 → clone.restore", async () => {
    const v_257b90 = await v_bfb240("clonelog-owner1@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "clonelog_soft");
    const v_21cc31 = await v_38cec9({ sub: v_257b90, kind: "access" });

    v_4d37e3((await v_51c3d2("DELETE", `/oth-path${v_6e0fd3}`, v_21cc31)).status).toBe(200);
    v_4d37e3(await v_62bb46(v_257b90, "clone.delete")).toEqual({ cloneId: v_6e0fd3, state: "soft_deleted" });

    v_4d37e3((await v_51c3d2("POST", `/oth-path${v_6e0fd3}/restore`, v_21cc31)).status).toBe(200);
    v_4d37e3(await v_62bb46(v_257b90, "clone.restore")).toEqual({ cloneId: v_6e0fd3 });
  });

  v_23805a("사용자 삭제(공동관리자 있음) → clone.delete transferred + newOwnerId", async () => {
    const v_257b90 = await v_bfb240("clonelog-owner2@test.local");
    const v_583293 = await v_bfb240("clonelog-coowner2@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "clonelog_transfer");
    await v_a1651b()
      .prepare(`INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`)
      .bind(v_6e0fd3, v_257b90, v_583293)
      .run();
    const v_21cc31 = await v_38cec9({ sub: v_257b90, kind: "access" });

    v_4d37e3((await v_51c3d2("DELETE", `/oth-path${v_6e0fd3}`, v_21cc31)).status).toBe(200);
    v_4d37e3(await v_62bb46(v_257b90, "clone.delete")).toEqual({ cloneId: v_6e0fd3, state: "transferred", newOwnerId: v_583293 });
  });

  v_23805a("관리자 삭제 → 소유자 user_id 로 clone.delete by=admin + reason", async () => {
    const v_257b90 = await v_bfb240("clonelog-owner3@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "clonelog_admin");
    const v_21cc31 = await v_38cec9({ sub: v_d72b33, kind: "access", admin: true });

    const v_8f00b9 = await v_51c3d2("DELETE", `/oth-path${v_6e0fd3}`, v_21cc31, { reason: "정책 위반으로 삭제 처리함" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_62bb46(v_257b90, "clone.delete")).toEqual({
      cloneId: v_6e0fd3,
      state: "soft_deleted",
      by: "admin",
      adminUserId: v_d72b33,
      reason: "정책 위반으로 삭제 처리함",
    });
  });
});
