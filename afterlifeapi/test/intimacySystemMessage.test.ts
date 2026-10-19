import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_721d54 } from "../src/lib/interactions";
import { v_a00a76 } from "../src/lib/conversationEvents";
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
  const v_556427 = `ism${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_1badb6, v_1833e7, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_38715b<T>(v_43e90c, v_9fe22d): Promise<T> {
  const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, { headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` } });
  v_4d37e3(v_8f00b9.status).toBe(200);
  return v_8f00b9.json<T>();
}

v_469bf2("intimacy system message", () => {
  v_23805a("10°C 단위를 넘을 때만 시스템 메시지 1건 + 타임라인·헤더 온도", async () => {
    const v_257b90 = await v_bfb240("owner");
    const v_debed8 = await v_bfb240("viewer");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "민지");
    await v_a1651b().prepare(`INSERT INTO clone_follows (user_id, clone_id) VALUES (?, ?)`).bind(v_debed8, v_6e0fd3).run();

    const v_9e86fd = v_c9c489 as unknown as v_273a0c;
    await v_721d54(v_9e86fd, v_debed8, v_6e0fd3, 5, "chat"); 
    await v_721d54(v_9e86fd, v_debed8, v_6e0fd3, 6, "chat"); 

    const v_7866ae = await v_a1651b()
      .prepare(`SELECT kind, payload FROM conversation_events WHERE user_id = ? AND clone_id = ?`)
      .bind(v_debed8, v_6e0fd3)
      .all<{ kind: string; payload: string }>();
    v_4d37e3(v_7866ae.results).toHaveLength(1);
    v_4d37e3(JSON.parse(v_7866ae.results[0]!.payload)).toEqual({ score: 10 });

    const v_f4e98d = await v_a1651b()
      .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = 'intimacy_score'`)
      .bind(v_debed8)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(0);

    const v_fcb4e5 = await v_38715b<{ intimacy: number; items: Array<{ type: string; text?: string }> }>(
      v_debed8,
      `/oth-path${v_6e0fd3}/timeline`,
    );
    v_4d37e3(v_fcb4e5.intimacy).toBe(11);
    const v_1a85dc = v_fcb4e5.items.filter((v_ebec57) => v_ebec57.type === "system");
    v_4d37e3(v_1a85dc).toHaveLength(1);
    v_4d37e3(v_1a85dc[0]!.text).toBe("민지와의 온도가 10°C가 됐어요");
  });

  v_23805a("답장 미확인 푸시: 읽었으면 X, 안 읽었으면 O, 채팅방 알림 끄기면 X / 인앱 목록엔 안 남음", async () => {
    const v_257b90 = await v_bfb240("owner3");
    const v_debed8 = await v_bfb240("viewer3");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "하늘");
    const v_9e86fd = v_c9c489 as unknown as v_273a0c;
    const v_4317d1 = { userId: v_debed8, cloneId: v_6e0fd3, cloneName: "하늘", replyCreatedAt: "2026-10-19 12:00:00", replyText: "안녕!" };

    v_4d37e3(await v_a00a76(v_9e86fd, v_4317d1, 0)).toBe(true);

    await v_a1651b()
      .prepare(`INSERT INTO conversation_read_markers (user_id, clone_id, last_read_at) VALUES (?, ?, '2026-10-19 12:00:05')`)
      .bind(v_debed8, v_6e0fd3)
      .run();
    v_4d37e3(await v_a00a76(v_9e86fd, v_4317d1, 0)).toBe(false);

    const v_b3355e = { ...v_4317d1, replyCreatedAt: "2026-10-19 12:10:00" };
    await v_a1651b().prepare(`INSERT INTO clone_notification_mutes (user_id, clone_id) VALUES (?, ?)`).bind(v_debed8, v_6e0fd3).run();
    v_4d37e3(await v_a00a76(v_9e86fd, v_b3355e, 0)).toBe(false);

    const v_f4e98d = await v_a1651b()
      .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?`)
      .bind(v_debed8)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(0);
  });

  v_23805a("mark-read: at(본 시각) 반영 · 마커는 뒤로 가지 않음 · 그 뒤 답장은 안 읽음", async () => {
    const v_257b90 = await v_bfb240("owner4");
    const v_debed8 = await v_bfb240("viewer4");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "바다");
    await v_a1651b().prepare(`INSERT INTO clone_follows (user_id, clone_id) VALUES (?, ?)`).bind(v_debed8, v_6e0fd3).run();
    const v_5e9523 = async (v_83d291) => {
      const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/mark-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await v_21cc31(v_debed8)}`, "Content-Type": "application/json" },
        body: JSON.stringify(v_83d291 === undefined ? {} : { at: v_83d291 }),
      });
      v_4d37e3(v_8f00b9.status).toBe(200);
      return (await v_a1651b()
        .prepare(`SELECT last_read_at FROM conversation_read_markers WHERE user_id = ? AND clone_id = ?`)
        .bind(v_debed8, v_6e0fd3)
        .first<{ last_read_at: string }>())!.last_read_at;
    };
    const v_a0bb1f = Date.now() - 30_000;
    const v_6b5493 = await v_5e9523(v_a0bb1f);
    v_4d37e3(v_6b5493).toBe(new Date(Math.floor(v_a0bb1f / 1000) * 1000).toISOString().slice(0, 19).replace("T", " "));

    v_4d37e3(await v_5e9523(v_a0bb1f - 10_000)).toBe(v_6b5493);

    const v_812cf3 = new Date(v_a0bb1f + 5_000).toISOString().slice(0, 19).replace("T", " ");
    v_4d37e3(
      await v_a00a76(
        v_c9c489 as unknown as v_273a0c,
        { userId: v_debed8, cloneId: v_6e0fd3, cloneName: "바다", replyCreatedAt: v_812cf3, replyText: "응!" },
        0,
      ),
    ).toBe(true);
  });

  v_23805a("통화만 한 페르소나도 메세지 목록에 포함", async () => {
    const v_257b90 = await v_bfb240("owner2");
    const v_debed8 = await v_bfb240("viewer2");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "지은");
    await v_a1651b()
      .prepare(`INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)`)
      .bind(`call-${v_6e0fd3}`, v_debed8, v_6e0fd3, Date.now())
      .run();
    const v_ef8ab1 = await v_38715b<{ items: Array<{ clone: { id: number } }> }>(v_debed8, `/oth-path`);
    v_4d37e3(v_ef8ab1.items.map((v_ebec57) => v_ebec57.clone.id)).toContain(v_6e0fd3);
  });
});
