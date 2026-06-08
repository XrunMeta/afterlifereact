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

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_d6cdd0(v_6e0fd3, v_1badb6, v_489382): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status, created_at)
       VALUES (?, ?, ?, 'owner', 'accepted', CURRENT_TIMESTAMP)`,
    )
    .bind(v_6e0fd3, v_1badb6, v_489382)
    .run();
}

async function v_2adc1d(v_6e0fd3): Promise<{ owner_id: number; deletion_state: string; owner_cascade_deleted_at: string | null }> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  return (await v_a1651b
    .prepare("SELECT owner_id, deletion_state, owner_cascade_deleted_at FROM clones WHERE id = ?")
    .bind(v_6e0fd3)
    .first())! as never;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_55fc7c(v_21cc31): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
}

const v_8c880b = "Abcdef1";

v_469bf2("회원 탈퇴 cascade — 소유 클론 숨김 (복구 없음)", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("탈퇴 시 솔로 소유 active 클론 → soft_deleted + cascade 표식", async () => {
    const v_0c8987 = await v_5d1973("casc-solo@test.local", v_8c880b);
    const v_6e7a7d = await v_4d24a9(v_0c8987, "casc_solo_1");
    const v_c8af91 = await v_4d24a9(v_0c8987, "casc_solo_2");

    const v_8f00b9 = await v_55fc7c(await v_86c39f(v_0c8987));
    v_4d37e3(v_8f00b9.status).toBe(200);

    for (const v_389afb of [v_6e7a7d, v_c8af91]) {
      const v_3ac7e7 = await v_2adc1d(v_389afb);
      v_4d37e3(v_3ac7e7.deletion_state).toBe("soft_deleted");
      v_4d37e3(v_3ac7e7.owner_cascade_deleted_at).not.toBeNull();
      v_4d37e3(v_3ac7e7.owner_id).toBe(v_0c8987);
    }
  });

  v_23805a("공동관리자(successor) 있는 클론은 위임 — soft-delete 아님, owner 변경", async () => {
    const v_257b90 = await v_5d1973("casc-owner@test.local", v_8c880b);
    const v_1cdf95 = await v_5d1973("casc-coowner@test.local", v_8c880b);
    const v_b1c995 = await v_4d24a9(v_257b90, "casc_shared");
    await v_d6cdd0(v_b1c995, v_257b90, v_1cdf95);

    v_4d37e3((await v_55fc7c(await v_86c39f(v_257b90))).status).toBe(200);

    const v_3ac7e7 = await v_2adc1d(v_b1c995);
    v_4d37e3(v_3ac7e7.deletion_state).toBe("active"); 
    v_4d37e3(v_3ac7e7.owner_id).toBe(v_1cdf95); 
    v_4d37e3(v_3ac7e7.owner_cascade_deleted_at).toBeNull();
  });

  v_23805a("탈퇴 유저의 cascade 클론은 discover 피드에서 사라짐", async () => {
    const v_0c8987 = await v_5d1973("casc-feed@test.local", v_8c880b);
    const v_6e0fd3 = await v_4d24a9(v_0c8987, "casc_feed_clone");

    const v_e98932 = await v_1df298.fetch("http://localhost/oth-path?limit=50");
    const v_471f75 = (await v_e98932.json()) as { items?: Array<{ cloneId?: number }> };
    const v_961fc7 = (v_471f75.items ?? []).map((v_ebec57) => v_ebec57.cloneId);
    v_4d37e3(v_961fc7).toContain(v_6e0fd3);

    v_4d37e3((await v_55fc7c(await v_86c39f(v_0c8987))).status).toBe(200);

    const v_33efc5 = await v_1df298.fetch("http://localhost/oth-path?limit=50");
    const v_4adfe0 = (await v_33efc5.json()) as { items?: Array<{ cloneId?: number }> };
    const v_a6b16f = (v_4adfe0.items ?? []).map((v_ebec57) => v_ebec57.cloneId);
    v_4d37e3(v_a6b16f).not.toContain(v_6e0fd3);
  });
});
