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

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(v_556427)
    .first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_e90099(
  v_6e0fd3,
  v_43e90c,
  v_c5607b,
  v_22da99,
  v_453c44,
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;

  await v_a1651b
    .prepare(
      `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
       VALUES (?, ?, ?, ?, NULL, 'active', 'pending')`,
    )
    .bind(v_6e0fd3, v_43e90c, v_c5607b, v_22da99)
    .run();
  void v_453c44;
  const v_35f85c = await v_a1651b
    .prepare(
      `SELECT id FROM messages WHERE clone_id = ? AND user_id = ? AND role = ? ORDER BY id DESC LIMIT 1`,
    )
    .bind(v_6e0fd3, v_43e90c, v_22da99)
    .first<{ id: number }>();
  return v_35f85c!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_fc6bcf(): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();
  if (v_3ac7e7) return;
  const v_e6465d = (v_c9c489 as { MASTER_ROOT?: string }).MASTER_ROOT;
  if (!v_e6465d) throw new Error("MASTER_ROOT missing in test env");
  const { generateKekAndWrap: v_8bb5d2 } = await import("../src/lib/kekProvider");
  const { encryptedKek: v_8f246d } = v_8bb5d2(v_e6465d);
  await v_a1651b
    .prepare(
      `INSERT INTO encryption_keys (kek_id, version, encrypted_kek, status)
       VALUES ('kek_test_v1', 1, ?, 'active')`,
    )
    .bind(v_8f246d)
    .run();
}

v_469bf2("messages route — contract", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error("D1 migrations not applied.");
    }
    await v_fc6bcf();
  });

  v_23805a("GET /oth-path — items shape 검증 (snapshot 정합)", async () => {
    const v_1badb6 = await v_bfb240("msg-o@test.local");
    const v_43e90c = await v_bfb240("msg-u@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "msg_clone");

    const v_c5607b = "sess-test-01";
    const v_79e089 = await v_e90099(v_6e0fd3, v_43e90c, v_c5607b, "user", "hi");
    const v_6e7a7d = await v_e90099(v_6e0fd3, v_43e90c, v_c5607b, "clone", "hello");

    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_1df298.fetch(
      `http://localhost/oth-path${v_6e0fd3}/messages`,
      { headers: { Authorization: `Bearer ${v_21cc31}` } },
    );
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      items: Array<{
        id: number;
        sessionId: string;
        role: "user" | "clone";
        content: string | null;
        createdAt: string;
      }>;
      nextCursor: number | null;
    };
    v_4d37e3(Array.isArray(v_4d33b2.items)).toBe(true);
    const v_52e08b = v_4d33b2.items.map((v_ebec57) => v_ebec57.id).sort((v_779914, v_148ff6) => v_779914 - v_148ff6);
    v_4d37e3(v_52e08b).toEqual([v_79e089, v_6e7a7d].sort((v_779914, v_148ff6) => v_779914 - v_148ff6));
    for (const v_8c0b26 of v_4d33b2.items) {
      v_4d37e3(v_8c0b26.sessionId).toBe(v_c5607b);
      v_4d37e3(["user", "clone"]).toContain(v_8c0b26.role);
      v_4d37e3(typeof v_8c0b26.createdAt).toBe("string");
    }
    v_4d37e3(v_4d33b2).toHaveProperty("nextCursor");
  });
});
