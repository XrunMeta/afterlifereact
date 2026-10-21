import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_721d54 } from "../src/lib/interactions";
import type { v_273a0c } from "../src/lib/env";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_bd1444): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(`${v_bd1444}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_4d24a9(v_1badb6, v_1833e7): Promise<number> {
  const v_556427 = `lv${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_1833e7, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_51c3d2<T>(v_43e90c, v_bfe9b9, v_9fe22d): Promise<{ status: number; json: T }> {
  const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<T>() };
}

type ListRes = { items: Array<{ clone: { id: number } }> };
type TimelineRes = { intimacy: number; items: Array<{ type: string }> };

v_469bf2("대화방 나가기", () => {
  v_23805a("구독한 페르소나: 구독 취소 · 목록/대화방/온도 초기화 · 원본·이력 보존", async () => {
    const v_257b90 = await v_bfb240("lv-owner");
    const v_debed8 = await v_bfb240("lv-viewer");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "민지");
    await v_a1651b().prepare(`INSERT INTO clone_follows (user_id, clone_id) VALUES (?, ?)`).bind(v_debed8, v_6e0fd3).run();
    await v_721d54(v_c9c489 as unknown as v_273a0c, v_debed8, v_6e0fd3, 12, "chat"); 
    await v_a1651b()
      .prepare(`INSERT INTO clone_ont (clone_id, user_id, data) VALUES (?, ?, '{"이름":"뷰어"}')`)
      .bind(v_6e0fd3, v_debed8)
      .run();

    const v_e98932 = await v_51c3d2<TimelineRes>(v_debed8, "GET", `/oth-path${v_6e0fd3}/timeline`);
    v_4d37e3(v_e98932.json.intimacy).toBe(12);
    v_4d37e3(v_e98932.json.items.length).toBeGreaterThan(0);

    const v_cb35cb = await v_51c3d2<{ kind: string; unsubscribed: boolean }>(v_debed8, "POST", `/oth-path${v_6e0fd3}/leave`);
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json).toMatchObject({ kind: "subscribed", unsubscribed: true });

    const v_8b5cd8 = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM clone_follows WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_8b5cd8?.n).toBe(0);

    const v_ef8ab1 = await v_51c3d2<ListRes>(v_debed8, "GET", `/oth-path`);
    v_4d37e3(v_ef8ab1.json.items.find((v_ebec57) => v_ebec57.clone.id === v_6e0fd3)).toBeUndefined();

    const v_33efc5 = await v_51c3d2<TimelineRes>(v_debed8, "GET", `/oth-path${v_6e0fd3}/timeline`);
    v_4d37e3(v_33efc5.json.intimacy).toBe(0);
    v_4d37e3(v_33efc5.json.items).toHaveLength(0);

    const v_4ac915 = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM intimacy_events WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_4ac915?.n).toBe(1);
    const v_57bd49 = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM conversation_events WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_57bd49?.n).toBe(1);
    const v_a769bb = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM clone_ont WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_a769bb?.n).toBe(0);
    const v_803f36 = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM clone_ont_archive WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_803f36?.n).toBe(1);

    const v_0f0c77 = await v_a1651b().prepare(`SELECT kind, prev_intimacy FROM conversation_leaves WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ kind: string; prev_intimacy: number }>();
    v_4d37e3(v_0f0c77).toMatchObject({ kind: "subscribed", prev_intimacy: 12 });
  });

  v_23805a("나간 뒤 다시 대화하면 그때부터 새로 쌓이고 목록에 다시 보인다 · 이력은 매번 따로", async () => {
    const v_257b90 = await v_bfb240("lv2-owner");
    const v_debed8 = await v_bfb240("lv2-viewer");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "하늘");
    await v_51c3d2(v_debed8, "POST", `/oth-path${v_6e0fd3}/leave`);

    await v_a1651b()
      .prepare(`INSERT INTO conversation_events (user_id, clone_id, kind, payload, created_at) VALUES (?, ?, 'intimacy_milestone', '{"score":10}', ?)`)
      .bind(v_debed8, v_6e0fd3, Date.now() + 1000)
      .run();
    const v_ef8ab1 = await v_51c3d2<ListRes>(v_debed8, "GET", `/oth-path`);
    v_4d37e3(v_ef8ab1.json.items.find((v_ebec57) => v_ebec57.clone.id === v_6e0fd3)).toBeDefined();

    await v_51c3d2(v_debed8, "POST", `/oth-path${v_6e0fd3}/leave`);
    const v_f4e98d = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM conversation_leaves WHERE user_id = ? AND clone_id = ?`).bind(v_debed8, v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(2);
  });

  v_23805a("내가 만든 페르소나: 나가면 새 대화 전까지 목록에서 숨김", async () => {
    const v_257b90 = await v_bfb240("lv3-owner");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "나의 페르소나");
    const v_e98932 = await v_51c3d2<ListRes>(v_257b90, "GET", `/oth-path`);
    v_4d37e3(v_e98932.json.items.find((v_ebec57) => v_ebec57.clone.id === v_6e0fd3)).toBeDefined();
    const v_cb35cb = await v_51c3d2<{ kind: string }>(v_257b90, "POST", `/oth-path${v_6e0fd3}/leave`);
    v_4d37e3(v_cb35cb.json.kind).toBe("owned");
    const v_33efc5 = await v_51c3d2<ListRes>(v_257b90, "GET", `/oth-path`);
    v_4d37e3(v_33efc5.json.items.find((v_ebec57) => v_ebec57.clone.id === v_6e0fd3)).toBeUndefined();
  });
});
