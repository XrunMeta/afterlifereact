import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `ridem-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_556427 = `ridem_clone_${v_1923e2}`;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, training_status, created_at, updated_at)
       VALUES (?, 'T', ?, 'friend', 'public', 'ready', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_10a60b(v_6e0fd3, v_0d61e1): Promise<{ commentId: number; feedId: number }> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO feeds (clone_id, content, created_at) VALUES (?, 'post', CURRENT_TIMESTAMP)`)
    .bind(v_6e0fd3)
    .run();
  const v_c09aa8 = (await v_a1651b.prepare("SELECT last_insert_rowid() AS id").first<{ id: number }>())!.id;
  await v_a1651b
    .prepare(`INSERT INTO feed_comments (feed_id, user_id, content, created_at) VALUES (?, ?, 'c', CURRENT_TIMESTAMP)`)
    .bind(v_c09aa8, v_0d61e1)
    .run();
  const v_d91518 = (await v_a1651b.prepare("SELECT last_insert_rowid() AS id").first<{ id: number }>())!.id;
  return { commentId: v_d91518, feedId: v_c09aa8 };
}

async function v_21cc31(v_43e90c, v_b7f2b4 = false): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
  return await v_b2eae5({ sub: v_43e90c, kind: "access", admin: v_b7f2b4 }, v_43fd42, 600);
}

function v_17dc8a(v_9fe22d, v_8d41d7, v_4d33b2): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

async function v_a10c69(v_cb9428, v_389afb): Promise<string | null> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b.prepare(`SELECT reviewed_at AS r FROM ${v_cb9428} WHERE id = ?`).bind(v_389afb).first<{ r: string | null }>();
  return v_cb35cb?.r ?? null;
}

v_469bf2("신고 PATCH reviewed_at 멱등성 (T-151-15b)", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_reports").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("user_reports: 최초 open→reviewed 전이에 reviewed_at 세팅", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_349ab3 = await v_21cc31(v_4e6894);

    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_f10744 = await v_a1651b
      .prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?")
      .bind(v_4e6894, v_5f5d6d)
      .first<{ id: number }>();
    const v_389afb = v_f10744!.id;

    v_4d37e3(await v_a10c69("user_reports", v_389afb)).toBeNull();

    const v_8f00b9 = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "reviewed" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_ea719c = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();
  });

  v_23805a("user_reports: 같은 상태로 재PATCH해도 reviewed_at 불변", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_349ab3 = await v_21cc31(v_4e6894);
    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_389afb = (
      await v_a1651b.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(v_4e6894, v_5f5d6d).first<{ id: number }>()
    )!.id;

    await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "reviewed" });
    const v_ea719c = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100)); 
    const v_48bbbd = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "reviewed", adminMessage: "수정된 메모" });
    v_4d37e3(v_48bbbd.status).toBe(200);
    const v_486a80 = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_486a80).toBe(v_ea719c);
  });

  v_23805a("user_reports: 다른 비open 상태로 바뀌어도 기존 reviewed_at 보존", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_349ab3 = await v_21cc31(v_4e6894);
    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_389afb = (
      await v_a1651b.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(v_4e6894, v_5f5d6d).first<{ id: number }>()
    )!.id;

    await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "reviewed" });
    const v_ea719c = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100));
    const v_48bbbd = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "dismissed" });
    v_4d37e3(v_48bbbd.status).toBe(200);
    const v_0dbc82 = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_0dbc82).toBe(v_ea719c);

    const v_0c452c = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "open" });
    v_4d37e3(v_0c452c.status).toBe(200);
    v_4d37e3(await v_a10c69("user_reports", v_389afb)).toBeNull();

    const v_5cbbc7 = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "actioned" });
    v_4d37e3(v_5cbbc7.status).toBe(200);
    const v_486a80 = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_486a80).toBeTruthy();
    v_4d37e3(v_486a80).not.toBe(v_ea719c);
  });

  v_23805a("clone_reports: 최초 세팅 + 같은 상태 재PATCH 시 불변", async () => {
    const v_4e6894 = await v_bfb240();
    const v_257b90 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(`INSERT INTO clone_reports (user_id, clone_id, reason, status, created_at) VALUES (?, ?, 'r', 'open', CURRENT_TIMESTAMP)`)
      .bind(v_4e6894, v_6e0fd3)
      .run();
    const v_389afb = (await v_a1651b.prepare("SELECT id FROM clone_reports WHERE user_id = ? AND clone_id = ?").bind(v_4e6894, v_6e0fd3).first<{ id: number }>())!
      .id;

    const v_8f00b9 = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "dismissed" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_ea719c = await v_a10c69("clone_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100));
    const v_48bbbd = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "dismissed", adminMessage: "메모 변경" });
    v_4d37e3(v_48bbbd.status).toBe(200);
    v_4d37e3(await v_a10c69("clone_reports", v_389afb)).toBe(v_ea719c);
  });

  v_23805a("comment_reports: 최초 세팅 + 같은 상태 재PATCH 시 불변", async () => {
    const v_4e6894 = await v_bfb240();
    const v_257b90 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    const { commentId: v_d91518 } = await v_10a60b(v_6e0fd3, v_257b90);
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        `INSERT INTO comment_reports (user_id, comment_id, feed_id, clone_id, reason, status, created_at)
         VALUES (?, ?, (SELECT feed_id FROM feed_comments WHERE id = ?), ?, 'r', 'open', CURRENT_TIMESTAMP)`,
      )
      .bind(v_4e6894, v_d91518, v_d91518, v_6e0fd3)
      .run();
    const v_389afb = (
      await v_a1651b.prepare("SELECT id FROM comment_reports WHERE user_id = ? AND comment_id = ?").bind(v_4e6894, v_d91518).first<{ id: number }>()
    )!.id;

    const v_8f00b9 = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "dismissed" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_ea719c = await v_a10c69("comment_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100));
    const v_48bbbd = await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "dismissed", adminMessage: "메모 변경" });
    v_4d37e3(v_48bbbd.status).toBe(200);
    v_4d37e3(await v_a10c69("comment_reports", v_389afb)).toBe(v_ea719c);
  });

  v_23805a("adminData dismiss(POST): 이미 reviewed 상태로 세팅된 reviewed_at 보존", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_349ab3 = await v_21cc31(v_4e6894);
    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_389afb = (
      await v_a1651b.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(v_4e6894, v_5f5d6d).first<{ id: number }>()
    )!.id;

    await v_17dc8a(`/oth-path${v_389afb}`, v_b7f2b4, { status: "reviewed" });
    const v_ea719c = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100));
    const v_9d3e16 = await v_1df298.fetch(`http://localhost/oth-path${v_389afb}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_b7f2b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "기각" }),
    });
    v_4d37e3(v_9d3e16.status).toBe(200);
    v_4d37e3(await v_a10c69("user_reports", v_389afb)).toBe(v_ea719c);

    const v_d308b5 = await v_a1651b.prepare("SELECT status AS s FROM user_reports WHERE id = ?").bind(v_389afb).first<{ s: string }>();
    v_4d37e3(v_d308b5?.s).toBe("dismissed");
  });

  v_23805a("adminData warn(POST, reportId 지정): 이미 처리된 신고에 경고 재부과해도 reviewed_at 불변", async () => {
    const v_4e6894 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_b7f2b4 = await v_21cc31(await v_bfb240(), true);
    const v_349ab3 = await v_21cc31(v_4e6894);
    await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_349ab3}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_389afb = (
      await v_a1651b.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(v_4e6894, v_5f5d6d).first<{ id: number }>()
    )!.id;

    const v_805c06 = await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/warn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_b7f2b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: v_389afb, reason: "1차 경고" }),
    });
    v_4d37e3(v_805c06.status).toBe(200);
    const v_ea719c = await v_a10c69("user_reports", v_389afb);
    v_4d37e3(v_ea719c).toBeTruthy();
    const v_616886 = await v_a1651b.prepare("SELECT status AS s FROM user_reports WHERE id = ?").bind(v_389afb).first<{ s: string }>();
    v_4d37e3(v_616886?.s).toBe("actioned");

    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 1100));
    const v_54c672 = await v_1df298.fetch(`http://localhost/oth-path${v_5f5d6d}/warn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_b7f2b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: v_389afb, reason: "2차(재부과) 경고" }),
    });
    v_4d37e3(v_54c672.status).toBe(200);
    v_4d37e3(await v_a10c69("user_reports", v_389afb)).toBe(v_ea719c);
  });
});
