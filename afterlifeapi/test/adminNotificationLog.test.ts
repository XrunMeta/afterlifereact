
import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_4ff4a9 = "https://console-preview2.example.invalid";
const v_491b6a = `nlog${Date.now()}`;
let v_79e089 = 0;

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

type Res = {
  items: Array<{ id: number; userId: number; email: string; type: string; title: string; isRead: number; createdAt: string }>;
  total: number;
  stats: { total: number; unread: number };
  types: Array<{ type: string; count: number }>;
};

async function v_38715b(v_212049, v_f17108 = v_4ff4a9): Promise<Response> {
  return v_1df298.fetch(`http://localhost/oth-path?${v_212049}`, {
    headers: v_f17108 ? { Origin: v_f17108 } : {},
  });
}

v_ba7107(async () => {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', '민지', CURRENT_TIMESTAMP)`)
    .bind(`${v_491b6a}-a@test.local`)
    .run();
  v_79e089 = v_cb35cb.meta.last_row_id as number;
  const v_43af15 = (v_3b27d9, v_9f1622, v_14226e, v_83d291) =>
    v_a1651b()
      .prepare(`INSERT INTO notifications (user_id, type, title, body, is_read, created_at) VALUES (?, ?, ?, 'b', ?, ?)`)
      .bind(v_79e089, v_3b27d9, v_9f1622, v_14226e, v_83d291)
      .run();

  await v_43af15("clone_like", "❤️ 좋아요", 1, "2026-10-31 03:00:00");
  await v_43af15("clone_comment", "💬 새 댓글", 0, "2026-11-01 15:30:00");
  await v_43af15("clone_like", "❤️ 좋아요", 0, "2026-11-03 01:00:00");
});

v_469bf2("GET /oth-path", () => {
  v_23805a("관리자 인증 없으면 거부", async () => {
    const v_8f00b9 = await v_38715b(`q=${v_491b6a}`, null);
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("검색(이메일) · 최신순 · 요약 · 종류 목록", async () => {
    const v_8f00b9 = await v_38715b(`q=${v_491b6a}`);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_148ff6 = await v_8f00b9.json<Res>();
    v_4d37e3(v_148ff6.total).toBe(3);
    v_4d37e3(v_148ff6.items.map((v_62c214) => v_62c214.createdAt)).toEqual(["2026-11-03 01:00:00", "2026-11-01 15:30:00", "2026-10-31 03:00:00"]);
    v_4d37e3(v_148ff6.items[0].email).toBe(`${v_491b6a}-a@test.local`);
    v_4d37e3(v_148ff6.stats).toEqual({ total: 3, unread: 2 });
    v_4d37e3(v_148ff6.types).toEqual([
      { type: "clone_like", count: 2 },
      { type: "clone_comment", count: 1 },
    ]);
  });

  v_23805a("종류·읽음 필터 — 요약은 읽음만, 종류 목록은 종류만 뺀 같은 조건", async () => {
    const v_148ff6 = await (await v_38715b(`q=${v_491b6a}&type=clone_like&read=0`)).json<Res>();
    v_4d37e3(v_148ff6.total).toBe(1);
    v_4d37e3(v_148ff6.stats).toEqual({ total: 2, unread: 1 });
    v_4d37e3(v_148ff6.types).toEqual([
      { type: "clone_comment", count: 1 },
      { type: "clone_like", count: 1 },
    ]);
  });

  v_23805a("기간은 KST 날짜 · 정렬 asc · 회원 ID 검색", async () => {
    const v_087ffc = await (await v_38715b(`q=${v_491b6a}&from=2026-11-02&to=2026-11-02`)).json<Res>();
    v_4d37e3(v_087ffc.items.map((v_62c214) => v_62c214.type)).toEqual(["clone_comment"]);
    const v_96aa6f = await (await v_38715b(`q=${v_491b6a}&order=asc`)).json<Res>();
    v_4d37e3(v_96aa6f.items[0].createdAt).toBe("2026-10-31 03:00:00");
    const v_b6b02f = await (await v_38715b(`q=${v_79e089}`)).json<Res>();
    v_4d37e3(v_b6b02f.items.every((v_62c214) => v_62c214.userId === v_79e089 || v_62c214.title.includes(String(v_79e089)))).toBe(true);
    v_4d37e3(v_b6b02f.total).toBeGreaterThanOrEqual(3);
  });
});
