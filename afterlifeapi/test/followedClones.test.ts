import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

interface ClonesRow { cnt: number }

async function v_2e4ad6(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_3a8949 = "memlow",
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_3a8949)
    .run();
  const v_3f4e2e = await v_a1651b
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(v_556427)
    .first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_979e03(v_6e0fd3, v_43e90c): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

v_469bf2("users route — followed clones", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("GET /oth-path — 본인이면 items 반환", async () => {
    const v_1badb6 = await v_bfb240("fc-o@test.local");
    const v_baf950 = await v_bfb240("fc-f@test.local");
    const v_6e7a7d = await v_4d24a9(v_1badb6, "fc_c1", "memlow");
    const v_c8af91 = await v_4d24a9(v_1badb6, "fc_c2", "friend");
    await v_979e03(v_6e7a7d, v_baf950);
    await v_979e03(v_c8af91, v_baf950);

    const v_21cc31 = await v_86c39f(v_baf950);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_baf950}/followed-clones`,
      { headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      items: Array<{
        id: number;
        name: string;
        username: string;
        cloneType: string;
        avatarUrl: string | null;
        stats: { followers: number; messages: number; gifts: number };
        createdAt: string;
      }>;
    };
    v_4d37e3(Array.isArray(v_4d33b2.items)).toBe(true);
    const v_52e08b = v_4d33b2.items.map((v_ebec57) => v_ebec57.id).sort((v_779914, v_148ff6) => v_779914 - v_148ff6);
    v_4d37e3(v_52e08b).toEqual([v_6e7a7d, v_c8af91].sort((v_779914, v_148ff6) => v_779914 - v_148ff6));
    v_4d37e3(v_4d33b2.items[0]!.stats).toBeDefined();
  });

  v_23805a("GET /oth-path — 타인이면 403", async () => {
    const v_779914 = await v_bfb240("fc-other-a@test.local");
    const v_148ff6 = await v_bfb240("fc-other-b@test.local");
    const v_21cc31 = await v_86c39f(v_779914);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_148ff6}/followed-clones`,
      { headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("GET /oth-path — 비로그인이면 401", async () => {
    const v_ceb55a = await v_bfb240("fc-anon@test.local");
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_ceb55a}/followed-clones`,
    );
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
