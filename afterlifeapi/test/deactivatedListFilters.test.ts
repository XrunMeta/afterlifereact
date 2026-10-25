import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(): Promise<number> {
  v_1923e2 += 1;
  const v_e0c7e8 = `dlf-${v_1923e2}-${Date.now()}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_818579 = "public"): Promise<number> {
  v_1923e2 += 1;
  const v_556427 = `dlf_clone_${v_1923e2}_${Date.now()}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, 'friend', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, `dlf_${v_1923e2}`, v_556427, v_818579)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_eb50a8(v_0c8987): Promise<void> {
  await v_a1651b().prepare("UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_0c8987).run();
}

async function v_9a1838(v_6e0fd3): Promise<void> {
  await v_a1651b().prepare("UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_6e0fd3).run();
}

async function v_c2bdf9(v_6e0fd3, v_1badb6, v_5f5d6d): Promise<void> {
  await v_a1651b()
    .prepare(`INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')`)
    .bind(v_6e0fd3, v_1badb6, v_5f5d6d)
    .run();
}

async function v_fa006d(v_6e0fd3): Promise<number> {
  await v_a1651b().prepare(`INSERT INTO feeds (clone_id, content, created_at) VALUES (?, 'post', CURRENT_TIMESTAMP)`).bind(v_6e0fd3).run();
  return (await v_a1651b().prepare("SELECT MAX(id) AS id FROM feeds WHERE clone_id = ?").bind(v_6e0fd3).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!, 600);
}

const v_ab9892 = new Map<number, string>();
async function v_38715b(v_9fe22d, v_0c8987): Promise<Response> {
  if (v_0c8987 && !v_ab9892.has(v_0c8987)) v_ab9892.set(v_0c8987, await v_21cc31(v_0c8987));
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, v_0c8987 ? { headers: { Authorization: `Bearer ${v_ab9892.get(v_0c8987)}` } } : {});
}

v_469bf2("비활성/정지 목록 필터 (2026-10-25)", () => {
  v_23805a("1. followed-clones: 비활성 소유자 클론은 팔로잉 탭에서 숨김, 정상 클론은 유지", async () => {
    const v_debed8 = await v_bfb240();
    const v_104cf1 = await v_bfb240();
    const v_4ec28d = await v_bfb240();
    const v_530263 = await v_4d24a9(v_104cf1);
    const v_3ed4c3 = await v_4d24a9(v_4ec28d);
    await v_a1651b().prepare("INSERT INTO clone_follows (clone_id, user_id) VALUES (?, ?), (?, ?)").bind(v_530263, v_debed8, v_3ed4c3, v_debed8).run();
    await v_eb50a8(v_104cf1);
    const v_8f00b9 = await v_38715b(`/oth-path${v_debed8}/followed-clones`, v_debed8);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ id: number }> };
    const v_52e08b = (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_52e08b).toContain(v_3ed4c3);
    v_4d37e3(v_52e08b).not.toContain(v_530263);
  });

  v_23805a("2. users followers/following: 비활성 계정 제외 · 대상 비활성이면 404 · 카운트 제외", async () => {
    const v_5f5d6d = await v_bfb240();
    const v_bb280b = await v_bfb240();
    const v_f3e03f = await v_bfb240();

    await v_a1651b()
      .prepare("INSERT INTO user_follows (follower_id, followee_id) VALUES (?,?),(?,?),(?,?),(?,?)")
      .bind(v_bb280b, v_5f5d6d, v_f3e03f, v_5f5d6d, v_5f5d6d, v_bb280b, v_5f5d6d, v_f3e03f)
      .run();
    await v_eb50a8(v_f3e03f);

    const v_debed8 = await v_bfb240();
    const v_e84077 = (await (await v_38715b(`/oth-path${v_5f5d6d}/followers`, v_debed8)).json()) as { items: Array<{ userId: number }> };
    v_4d37e3(v_e84077.items.map((v_ebec57) => v_ebec57.userId)).toEqual([v_bb280b]);
    const v_6d6539 = (await (await v_38715b(`/oth-path${v_5f5d6d}/following`, v_debed8)).json()) as { items: Array<{ userId: number }> };
    v_4d37e3(v_6d6539.items.map((v_ebec57) => v_ebec57.userId)).toEqual([v_bb280b]);

    const v_4a47e3 = (await (await v_38715b(`/oth-path${v_5f5d6d}`, v_debed8)).json()) as {
      followersCount?: number;
      followingCount?: number;
      user?: { followersCount?: number; followingCount?: number };
    };
    v_4d37e3(v_4a47e3.followersCount ?? v_4a47e3.user?.followersCount).toBe(1);
    v_4d37e3(v_4a47e3.followingCount ?? v_4a47e3.user?.followingCount).toBe(1);

    await v_eb50a8(v_5f5d6d);
    v_4d37e3((await v_38715b(`/oth-path${v_5f5d6d}/followers`, v_debed8)).status).toBe(404);
    v_4d37e3((await v_38715b(`/oth-path${v_5f5d6d}/following`, v_debed8)).status).toBe(404);
    v_4d37e3((await v_38715b(`/oth-path${v_5f5d6d}/followers`, v_5f5d6d)).status).toBe(200);
  });

  v_23805a("3. clones followers: 비활성 팔로워 제외 · 소유자 비활성/정지 클론은 타인 404 · 공동관리자 통과", async () => {
    const v_257b90 = await v_bfb240();
    const v_c4a45b = await v_bfb240();
    const v_bb280b = await v_bfb240();
    const v_f3e03f = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    await v_c2bdf9(v_6e0fd3, v_257b90, v_c4a45b);
    await v_a1651b().prepare("INSERT INTO clone_follows (clone_id, user_id) VALUES (?,?),(?,?)").bind(v_6e0fd3, v_bb280b, v_6e0fd3, v_f3e03f).run();
    await v_eb50a8(v_f3e03f);

    const v_3ed4c3 = await v_38715b(`/oth-path${v_6e0fd3}/followers`, v_1c6644);
    v_4d37e3(v_3ed4c3.status).toBe(200);
    const v_4d33b2 = (await v_3ed4c3.json()) as { items: Array<{ userId: number; email?: string }> };
    v_4d37e3(v_4d33b2.items.map((v_ebec57) => v_ebec57.userId)).toEqual([v_bb280b]);

    v_4d37e3(v_4d33b2.items[0]).toHaveProperty("email");

    await v_eb50a8(v_257b90);
    v_4d37e3((await v_38715b(`/oth-path${v_6e0fd3}/followers`, v_1c6644)).status).toBe(404);
    v_4d37e3((await v_38715b(`/oth-path${v_6e0fd3}/followers`, null)).status).toBe(404);
    v_4d37e3((await v_38715b(`/oth-path${v_6e0fd3}/followers`, v_c4a45b)).status).toBe(200);

    const v_ef5c08 = await v_bfb240();
    const v_c8af91 = await v_4d24a9(v_ef5c08);
    await v_9a1838(v_c8af91);
    v_4d37e3((await v_38715b(`/oth-path${v_c8af91}/followers`, v_1c6644)).status).toBe(404);
    v_4d37e3((await v_38715b(`/oth-path${v_c8af91}/followers`, v_ef5c08)).status).toBe(200);
  });

  v_23805a("4. gifts/summary: 정지/비활성 소유자 클론은 타인 차단 · 정상·공동관리자는 통과", async () => {
    const v_257b90 = await v_bfb240();
    const v_c4a45b = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_375bef = await v_4d24a9(v_257b90);
    v_4d37e3((await v_38715b(`/oth-path${v_375bef}/gifts/summary`, v_1c6644)).status).toBe(200);

    const v_a235b0 = await v_4d24a9(v_257b90);
    await v_c2bdf9(v_a235b0, v_257b90, v_c4a45b);
    await v_9a1838(v_a235b0);
    v_4d37e3((await v_38715b(`/oth-path${v_a235b0}/gifts/summary`, v_1c6644)).status).toBe(403);
    v_4d37e3((await v_38715b(`/oth-path${v_a235b0}/gifts/summary`, v_c4a45b)).status).toBe(200);

    const v_ef5c08 = await v_bfb240();
    const v_c8af91 = await v_4d24a9(v_ef5c08);
    await v_eb50a8(v_ef5c08);
    v_4d37e3((await v_38715b(`/oth-path${v_c8af91}/gifts/summary`, v_1c6644)).status).toBe(403);
  });

  v_23805a("5. 댓글/답글/좋아요 목록 5종: 정지·비활성 소유자 클론은 타인 차단, 정상·공동관리자는 통과", async () => {
    const v_257b90 = await v_bfb240();
    const v_c4a45b = await v_bfb240();
    const v_1c6644 = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_257b90);
    await v_c2bdf9(v_6e0fd3, v_257b90, v_c4a45b);
    const v_c09aa8 = await v_fa006d(v_6e0fd3);
    await v_a1651b().prepare(`INSERT INTO feed_comments (feed_id, user_id, content, created_at) VALUES (?, ?, 'c', CURRENT_TIMESTAMP)`).bind(v_c09aa8, v_1c6644).run();
    const v_062ae9 = (await v_a1651b().prepare("SELECT MAX(id) AS id FROM feed_comments WHERE feed_id = ?").bind(v_c09aa8).first<{ id: number }>())!.id;

    const v_d8a9e2 = [
      `/oth-path${v_c09aa8}/comments`,
      `/oth-path${v_c09aa8}/comments/${v_062ae9}/replies`,
      `/oth-path${v_c09aa8}/likes`,
      `/oth-path${v_6e0fd3}/comments`,
      `/oth-path${v_6e0fd3}/likes`,
    ];

    for (const v_e2a85c of v_d8a9e2) v_4d37e3((await v_38715b(v_e2a85c, v_1c6644)).status, v_e2a85c).toBe(200);

    await v_9a1838(v_6e0fd3);
    for (const v_e2a85c of v_d8a9e2) {
      v_4d37e3((await v_38715b(v_e2a85c, v_1c6644)).status, `정지 ${v_e2a85c}`).toBe(403);
      v_4d37e3((await v_38715b(v_e2a85c, null)).status, `정지 비로그인 ${v_e2a85c}`).toBe(403);
      v_4d37e3((await v_38715b(v_e2a85c, v_c4a45b)).status, `정지 공동관리자 ${v_e2a85c}`).toBe(200);
    }
    await v_a1651b().prepare("UPDATE clones SET admin_suspended_at = NULL WHERE id = ?").bind(v_6e0fd3).run();
    await v_eb50a8(v_257b90);
    for (const v_e2a85c of v_d8a9e2) {
      v_4d37e3((await v_38715b(v_e2a85c, v_1c6644)).status, `비활성 ${v_e2a85c}`).toBe(403);
      v_4d37e3((await v_38715b(v_e2a85c, v_c4a45b)).status, `비활성 공동관리자 ${v_e2a85c}`).toBe(200);
    }
  }, 30_000);
});
