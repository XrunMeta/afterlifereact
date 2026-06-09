import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `cn-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_556427 = `cn_clone_${v_1923e2}`;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_fa006d(v_6e0fd3): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, 'hi', NULL, NULL, CURRENT_TIMESTAMP)`,
    )
    .bind(v_6e0fd3)
    .run();
  return Number(v_cb35cb.meta.last_row_id);
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

v_469bf2("댓글 알림 — clone_comment data 에 feedId 포함", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM notifications").first();
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM feeds").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("다른 유저가 댓글 → owner 알림 data.feedId = 그 피드", async () => {
    const v_257b90 = await v_bfb240();
    const v_932c13 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    const v_c09aa8 = await v_fa006d(v_6e0fd3);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_c09aa8}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await v_21cc31(v_932c13)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: "좋은 글이에요" }),
    });
    v_4d37e3([200, 201]).toContain(v_8f00b9.status);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_25a5cd = await v_a1651b
      .prepare(
        `SELECT data_json FROM notifications
          WHERE user_id = ? AND type = 'clone_comment'
          ORDER BY id DESC LIMIT 1`,
      )
      .bind(v_257b90)
      .first<{ data_json: string }>();
    v_4d37e3(v_25a5cd).toBeTruthy();
    const v_9390e8 = JSON.parse(v_25a5cd!.data_json) as { cloneId?: number; feedId?: number };
    v_4d37e3(v_9390e8.cloneId).toBe(v_6e0fd3);
    v_4d37e3(v_9390e8.feedId).toBe(v_c09aa8);
  });
});
