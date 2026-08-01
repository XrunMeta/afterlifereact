import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_491b6a = "sptag";
let v_1923e2 = 0;

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(): Promise<number> {
  v_1923e2 += 1;
  const v_e0c7e8 = `susp-${v_1923e2}-${Date.now()}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_328259 = {}): Promise<number> {
  v_1923e2 += 1;
  const v_556427 = `${v_491b6a}_clone_${v_1923e2}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, `${v_491b6a}_${v_1923e2}`, v_556427, v_328259.cloneType ?? "friend", v_328259.visibility ?? "public")
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_c8e75a(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트 중지' WHERE id = ?`)
    .bind(v_6e0fd3)
    .run();
}

async function v_33c5ce(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`UPDATE clones SET admin_suspended_at = NULL, admin_suspend_reason = NULL WHERE id = ?`)
    .bind(v_6e0fd3)
    .run();
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_7f58d0(v_8d41d7): Promise<number[]> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path?q=${v_491b6a}&limit=50`, {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ id?: number }> };
  return (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.id!).filter(Boolean);
}

async function v_865bd1(v_8d41d7): Promise<number[]> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path?limit=50", {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ cloneId?: number }> };
  return (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.cloneId!).filter(Boolean);
}

async function v_37726f(v_8d41d7): Promise<number[]> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ cloneId?: number }> };
  return (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.cloneId!).filter(Boolean);
}

async function v_0ecb3a(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`INSERT INTO clone_shorts (clone_id, status, media_url) VALUES (?, 'ready', 'https://r2.example.com/s.mp4')`)
    .bind(v_6e0fd3)
    .run();
}

async function v_666f24(v_6e0fd3, v_8d41d7): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  return v_8f00b9.status;
}

v_469bf2("T-203 후속 — admin_suspended_at 외부 노출 차단", () => {
  v_23805a("검색: 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론은 둘 다에게 유지", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);

    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    const v_d4caf2 = await v_7f58d0(v_983772);
    v_4d37e3(v_d4caf2).toContain(v_7f572b);
    v_4d37e3(v_d4caf2).toContain(v_375bef);

    const v_86830d = await v_7f58d0(v_72c7a6);
    v_4d37e3(v_86830d).not.toContain(v_7f572b);
    v_4d37e3(v_86830d).toContain(v_375bef);
  });

  v_23805a("검색: 비로그인(anonymous)도 정지 클론은 못 봄", async () => {
    const v_257b90 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path?q=${v_491b6a}&limit=50`);
    const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ id?: number }> };
    const v_52e08b = (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.id!).filter(Boolean);
    v_4d37e3(v_52e08b).not.toContain(v_7f572b);
    v_4d37e3(v_52e08b).toContain(v_375bef);
  });

  v_23805a("홈피드(discover): 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론 유지", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);

    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    const v_fda135 = await v_865bd1(v_983772);
    v_4d37e3(v_fda135).toContain(v_7f572b);
    v_4d37e3(v_fda135).toContain(v_375bef);

    const v_fa094e = await v_865bd1(v_72c7a6);
    v_4d37e3(v_fa094e).not.toContain(v_7f572b);
    v_4d37e3(v_fa094e).toContain(v_375bef);
  });

  v_23805a("shorts 피드: 타인에게는 안 보이고 소유자 본인에게는 보인다 + 정상 클론 유지", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_0ecb3a(v_7f572b);
    await v_0ecb3a(v_375bef);
    await v_c8e75a(v_7f572b);

    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    const v_65790c = await v_37726f(v_983772);
    v_4d37e3(v_65790c).toContain(v_7f572b);
    v_4d37e3(v_65790c).toContain(v_375bef);

    const v_3b6725 = await v_37726f(v_72c7a6);
    v_4d37e3(v_3b6725).not.toContain(v_7f572b);
    v_4d37e3(v_3b6725).toContain(v_375bef);
  });

  v_23805a("통화(bundle): 타인은 403, 소유자는 200 + 정상 클론은 둘 다 200", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);

    const v_983772 = await v_21cc31(v_257b90);
    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3(await v_666f24(v_7f572b, v_983772)).toBe(200); 
    v_4d37e3(await v_666f24(v_7f572b, v_72c7a6)).toBe(403); 
    v_4d37e3(await v_666f24(v_375bef, v_983772)).toBe(200);
    v_4d37e3(await v_666f24(v_375bef, v_72c7a6)).toBe(200); 
  });

  v_23805a("공동관리자(coowner, share role='owner')는 정지 중에도 소유자와 동일하게 통화 가능", async () => {
    const v_257b90 = await v_bfb240();
    const v_583293 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90, { visibility: "private" });
    await v_c8e75a(v_7f572b);
    await v_a1651b()
      .prepare(
        `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`,
      )
      .bind(v_7f572b, v_257b90, v_583293)
      .run();

    const v_930b2e = await v_21cc31(v_583293);
    v_4d37e3(await v_666f24(v_7f572b, v_930b2e)).toBe(200);
  });

  v_23805a("정지 해제 후 타인에게 다시 보인다(검색·피드·shorts·통화 전부)", async () => {
    const v_257b90 = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    await v_0ecb3a(v_6e0fd3);
    await v_c8e75a(v_6e0fd3);

    const v_72c7a6 = await v_21cc31(v_1c6644);

    v_4d37e3(await v_7f58d0(v_72c7a6)).not.toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_72c7a6)).not.toContain(v_6e0fd3);
    v_4d37e3(await v_37726f(v_72c7a6)).not.toContain(v_6e0fd3);
    v_4d37e3(await v_666f24(v_6e0fd3, v_72c7a6)).toBe(403);

    await v_33c5ce(v_6e0fd3);
    v_4d37e3(await v_7f58d0(v_72c7a6)).toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_72c7a6)).toContain(v_6e0fd3);
    v_4d37e3(await v_37726f(v_72c7a6)).toContain(v_6e0fd3);
    v_4d37e3(await v_666f24(v_6e0fd3, v_72c7a6)).toBe(200);
  });

  v_23805a("followers/selected visibility 클론도 정지 시 자격 있는 타인에게 차단된다", async () => {
    const v_257b90 = await v_bfb240();
    const v_7efac5 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90, { visibility: "followers" });
    await v_a1651b()
      .prepare(`INSERT INTO clone_follows (clone_id, user_id) VALUES (?, ?)`)
      .bind(v_6e0fd3, v_7efac5)
      .run();

    const v_8db449 = await v_21cc31(v_7efac5);

    v_4d37e3(await v_7f58d0(v_8db449)).toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_8db449)).toContain(v_6e0fd3);

    await v_c8e75a(v_6e0fd3);

    v_4d37e3(await v_7f58d0(v_8db449)).not.toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_8db449)).not.toContain(v_6e0fd3);
  });

  v_23805a("selected visibility 클론도 정지 시 등록된 타인에게 차단되고, 소유자는 여전히 검색 가능(괄호 결합 회귀)", async () => {
    const v_257b90 = await v_bfb240();
    const v_f49fe0 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90, { visibility: "selected" });
    await v_a1651b()
      .prepare(`INSERT INTO clone_allowed_viewers (clone_id, user_id) VALUES (?, ?)`)
      .bind(v_6e0fd3, v_f49fe0)
      .run();

    const v_6369b9 = await v_21cc31(v_f49fe0);
    const v_983772 = await v_21cc31(v_257b90);

    v_4d37e3(await v_7f58d0(v_6369b9)).toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_6369b9)).toContain(v_6e0fd3);

    await v_c8e75a(v_6e0fd3);

    v_4d37e3(await v_7f58d0(v_6369b9)).not.toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_6369b9)).not.toContain(v_6e0fd3);

    v_4d37e3(await v_7f58d0(v_983772)).toContain(v_6e0fd3);
    v_4d37e3(await v_865bd1(v_983772)).toContain(v_6e0fd3);
  });
});
