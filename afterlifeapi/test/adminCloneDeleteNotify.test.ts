import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_121982(): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: 88803, kind: "access", admin: true }, v_43fd42, 600);
}

v_469bf2("DELETE /oth-path — 소유자 알림", () => {
  v_23805a("삭제하면 soft_deleted + 소유자 notifications 에 moderation 알림(사유 포함)", async () => {
    await v_a1651b()
      .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES ('acdn@test.local', 'x', 'U', CURRENT_TIMESTAMP)`)
      .run();
    const v_257b90 = (await v_a1651b().prepare("SELECT id FROM users WHERE email = 'acdn@test.local'").first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, '쿄카', 'acdn_clone', 'friend', 'public', CURRENT_TIMESTAMP)`)
      .bind(v_257b90)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare("SELECT id FROM clones WHERE username = 'acdn_clone'").first<{ id: number }>())!.id;

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await v_121982()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "운영정책 위반" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_a1651b().prepare("SELECT deletion_state FROM clones WHERE id = ?").bind(v_6e0fd3).first<{ deletion_state: string }>();
    v_4d37e3(v_3ac7e7?.deletion_state).toBe("soft_deleted");
    const v_f4e98d = await v_a1651b()
      .prepare("SELECT type, title, body FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1")
      .bind(v_257b90)
      .first<{ type: string; title: string; body: string }>();
    v_4d37e3(v_f4e98d?.type).toBe("moderation");
    v_4d37e3(v_f4e98d?.body).toContain("쿄카");
    v_4d37e3(v_f4e98d?.body).toContain("운영정책 위반");
  });
});
