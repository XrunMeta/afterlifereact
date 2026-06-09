import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_0d15aa(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_cb35cb = await v_a1651b.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>();
    return typeof v_cb35cb?.c === "number";
  } catch {
    return false;
  }
}

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `fbr-${v_1923e2}-${Math.floor(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_7e59ce(v_baf950, v_c53a19): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT OR IGNORE INTO user_follows (follower_id, followee_id) VALUES (?, ?)`)
    .bind(v_baf950, v_c53a19)
    .run();
}

async function v_b8689b(v_baf950, v_c53a19): Promise<boolean> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(`SELECT 1 AS x FROM user_follows WHERE follower_id = ? AND followee_id = ?`)
    .bind(v_baf950, v_c53a19)
    .first<{ x: number }>();
  return !!v_cb35cb;
}

async function v_f5edf6(v_5c3e6e, v_e9055d): Promise<boolean> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(`SELECT 1 AS x FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?`)
    .bind(v_5c3e6e, v_e9055d)
    .first<{ x: number }>();
  return !!v_cb35cb;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_a0c9cd(v_9fe22d, v_21cc31, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
}

function v_55fc7c(v_21cc31): Promise<Response> {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
}

v_469bf2("탈퇴 시 팔로우 삭제 + 차단/신고 언팔로우 컬럼 버그", () => {
  v_ba7107(async () => {
    if (!(await v_0d15aa())) throw new Error("D1 migrations not applied.");
  });

  v_23805a("탈퇴 시 팔로우/팔로워 관계가 양방향 삭제됨", async () => {
    const v_b32680 = await v_bfb240();
    const v_7efac5 = await v_bfb240(); 
    const v_23dcea = await v_bfb240(); 
    await v_7e59ce(v_7efac5, v_b32680);
    await v_7e59ce(v_b32680, v_23dcea);
    v_4d37e3(await v_b8689b(v_7efac5, v_b32680)).toBe(true);
    v_4d37e3(await v_b8689b(v_b32680, v_23dcea)).toBe(true);

    v_4d37e3((await v_55fc7c(await v_86c39f(v_b32680))).status).toBe(200);

    v_4d37e3(await v_b8689b(v_7efac5, v_b32680)).toBe(false);
    v_4d37e3(await v_b8689b(v_b32680, v_23dcea)).toBe(false);
  });

  v_23805a("차단 시 200 + 양방향 언팔로우 (following_id 컬럼 버그 회귀 방지)", async () => {
    const v_779914 = await v_bfb240();
    const v_148ff6 = await v_bfb240();
    await v_7e59ce(v_779914, v_148ff6);
    await v_7e59ce(v_148ff6, v_779914);

    const v_8f00b9 = await v_a0c9cd(`/oth-path${v_148ff6}/block`, await v_86c39f(v_779914));
    v_4d37e3(v_8f00b9.status).toBe(200); 

    v_4d37e3(await v_b8689b(v_779914, v_148ff6)).toBe(false);
    v_4d37e3(await v_b8689b(v_148ff6, v_779914)).toBe(false);
    v_4d37e3(await v_f5edf6(v_779914, v_148ff6)).toBe(true);
  });

  v_23805a("신고 시 200(reported) + 자동 차단 + 언팔로우 (500 회귀 방지)", async () => {
    const v_779914 = await v_bfb240();
    const v_148ff6 = await v_bfb240();
    await v_7e59ce(v_779914, v_148ff6);

    const v_8f00b9 = await v_a0c9cd(`/oth-path${v_148ff6}/report`, await v_86c39f(v_779914), { reason: "spam" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { reported?: boolean };
    v_4d37e3(v_7ecfd1.reported).toBe(true);

    v_4d37e3(await v_b8689b(v_779914, v_148ff6)).toBe(false);
    v_4d37e3(await v_f5edf6(v_779914, v_148ff6)).toBe(true);
  });
});
