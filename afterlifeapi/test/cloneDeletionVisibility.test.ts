import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_2e4ad6(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare("SELECT COUNT(*) AS cnt FROM clones").first<{ cnt: number }>();
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
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_598405)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_328259 = {},
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, is_system, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427, v_328259.visibility ?? "public", v_328259.isSystem ? 1 : 0)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_2adc1d(
  v_6e0fd3,
): Promise<{ deletion_state: string; deleted_at: string | null; soft_deleted_at: string | null }> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  return (await v_a1651b
    .prepare("SELECT deletion_state, deleted_at, soft_deleted_at FROM clones WHERE id = ?")
    .bind(v_6e0fd3)
    .first())! as never;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_66fc18(v_9fe22d, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, { headers: { Authorization: `Bearer ${v_21cc31}` } });
}

function v_30bf80(v_9fe22d, v_21cc31): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, { method: "DELETE", headers: { Authorization: `Bearer ${v_21cc31}` } });
}

function v_a0c9cd(v_9fe22d, v_21cc31, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

const v_8c880b = "Abcdef1";

v_469bf2("T-201 — 클론 삭제 시 전면 비노출 + 상태 필드 정합화", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("DELETE /oth-path 는 deletion_state 와 deleted_at 을 함께 세팅한다 (쓰기 경로 통일)", async () => {
    const v_257b90 = await v_5d1973("t201-write@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t201_write_clone");
    const v_21cc31 = await v_86c39f(v_257b90);

    const v_8f00b9 = await v_30bf80(`/oth-path${v_6e0fd3}`, v_21cc31);
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_3ac7e7 = await v_2adc1d(v_6e0fd3);
    v_4d37e3(v_3ac7e7.deletion_state).toBe("soft_deleted");
    v_4d37e3(v_3ac7e7.soft_deleted_at).not.toBeNull();

    v_4d37e3(v_3ac7e7.deleted_at).not.toBeNull();
  });

  v_23805a("삭제된 시스템 클론은 GET /oth-path('통화 가능' 목록)에서 사라진다", async () => {
    const v_257b90 = await v_5d1973("t201-sys@test.local", v_8c880b);
    const v_debed8 = await v_5d1973("t201-sys-viewer@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t201_sys_clone", { isSystem: true });

    const v_7d0764 = await v_86c39f(v_debed8);
    const v_e98932 = await v_66fc18("/oth-path", v_7d0764);
    const v_471f75 = (await v_e98932.json()) as { items: Array<{ id: number }> };
    v_4d37e3(v_471f75.items.map((v_ebec57) => v_ebec57.id)).toContain(v_6e0fd3);

    const v_5294e1 = await v_86c39f(v_257b90);
    v_4d37e3((await v_30bf80(`/oth-path${v_6e0fd3}`, v_5294e1)).status).toBe(200);

    const v_33efc5 = await v_66fc18("/oth-path", v_7d0764);
    const v_4adfe0 = (await v_33efc5.json()) as { items: Array<{ id: number }> };
    v_4d37e3(v_4adfe0.items.map((v_ebec57) => v_ebec57.id)).not.toContain(v_6e0fd3);
  });

  v_23805a("삭제된 클론은 소유자 본인의 GET /oth-path 목록에서도 사라진다", async () => {
    const v_257b90 = await v_5d1973("t201-owner@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t201_owner_clone");
    const v_21cc31 = await v_86c39f(v_257b90);

    const v_e98932 = await v_66fc18("/oth-path", v_21cc31);
    const v_471f75 = (await v_e98932.json()) as { items?: Array<{ id: number }> };
    v_4d37e3((v_471f75.items ?? []).map((v_ebec57) => v_ebec57.id)).toContain(v_6e0fd3);

    v_4d37e3((await v_30bf80(`/oth-path${v_6e0fd3}`, v_21cc31)).status).toBe(200);

    const v_33efc5 = await v_66fc18("/oth-path", v_21cc31);
    const v_4adfe0 = (await v_33efc5.json()) as { items?: Array<{ id: number }> };
    v_4d37e3((v_4adfe0.items ?? []).map((v_ebec57) => v_ebec57.id)).not.toContain(v_6e0fd3);
  });

  v_23805a("삭제된 클론 cloneId 로 통화 시작 시도 → 404 (딥링크·캐시된 cloneId 방어)", async () => {
    const v_257b90 = await v_5d1973("t201-call@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t201_call_clone");
    const v_21cc31 = await v_86c39f(v_257b90);

    v_4d37e3((await v_30bf80(`/oth-path${v_6e0fd3}`, v_21cc31)).status).toBe(200);

    const v_b72a1c = await v_a0c9cd(`/oth-path${v_6e0fd3}/call`, v_21cc31, {});
    v_4d37e3(v_b72a1c.status).toBe(404);

    const v_ac97e6 = await v_66fc18(`/oth-path${v_6e0fd3}/bundle`, v_21cc31);
    v_4d37e3(v_ac97e6.status).toBe(404);
  });

  v_23805a("복구(restore) 시 deleted_at 도 함께 클리어되고 목록에 다시 노출된다", async () => {
    const v_257b90 = await v_5d1973("t201-restore@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_257b90, "t201_restore_clone");
    const v_21cc31 = await v_86c39f(v_257b90);

    v_4d37e3((await v_30bf80(`/oth-path${v_6e0fd3}`, v_21cc31)).status).toBe(200);
    const v_86952f = await v_2adc1d(v_6e0fd3);
    v_4d37e3(v_86952f.deleted_at).not.toBeNull();

    const v_c901f0 = await v_a0c9cd(`/oth-path${v_6e0fd3}/restore`, v_21cc31);
    v_4d37e3(v_c901f0.status).toBe(200);

    const v_b53d24 = await v_2adc1d(v_6e0fd3);
    v_4d37e3(v_b53d24.deletion_state).toBe("active");
    v_4d37e3(v_b53d24.deleted_at).toBeNull();
    v_4d37e3(v_b53d24.soft_deleted_at).toBeNull();

    const v_33efc5 = await v_66fc18("/oth-path", v_21cc31);
    const v_4adfe0 = (await v_33efc5.json()) as { items?: Array<{ id: number }> };
    v_4d37e3((v_4adfe0.items ?? []).map((v_ebec57) => v_ebec57.id)).toContain(v_6e0fd3);
  });

  v_23805a("⚠️ 회귀 1순위 — 다른 클론을 삭제해도 정상(active) 클론은 계속 노출된다", async () => {
    const v_257b90 = await v_5d1973("t201-regress@test.local", v_8c880b);
    const v_554070 = await v_4d24a9(v_257b90, "t201_regress_keep", { isSystem: true });
    const v_08941a = await v_4d24a9(v_257b90, "t201_regress_drop", { isSystem: true });
    const v_21cc31 = await v_86c39f(v_257b90);

    v_4d37e3((await v_30bf80(`/oth-path${v_08941a}`, v_21cc31)).status).toBe(200);

    const v_1a85dc = await v_66fc18("/oth-path", v_21cc31);
    const v_287ca3 = (await v_1a85dc.json()) as { items: Array<{ id: number }> };
    const v_88dc00 = v_287ca3.items.map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_88dc00).toContain(v_554070);
    v_4d37e3(v_88dc00).not.toContain(v_08941a);

    const v_1c1268 = await v_66fc18("/oth-path", v_21cc31);
    const v_a8f760 = (await v_1c1268.json()) as { items?: Array<{ id: number }> };
    const v_96150f = (v_a8f760.items ?? []).map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_96150f).toContain(v_554070);
    v_4d37e3(v_96150f).not.toContain(v_08941a);

    const v_ac97e6 = await v_66fc18(`/oth-path${v_554070}/bundle`, v_21cc31);
    v_4d37e3(v_ac97e6.status).toBe(200);

    const v_2db2a5 = await v_1df298.fetch("http://localhost/oth-path?limit=200");
    const v_a1d1c7 = (await v_2db2a5.json()) as { items?: Array<{ cloneId?: number }> };
    const v_b8165d = (v_a1d1c7.items ?? []).map((v_ebec57) => v_ebec57.cloneId);
    v_4d37e3(v_b8165d).toContain(v_554070);
    v_4d37e3(v_b8165d).not.toContain(v_08941a);
  });
});
