import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_5f5ee2 } from "../src/lib/notify";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(): Promise<number> {
  const v_e0c7e8 = `notif-prefs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_51c3d2(v_bfe9b9, v_9edd60, v_4d33b2) {
  const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_9edd60}`, "Content-Type": "application/json" },
    body: v_4d33b2 === undefined ? undefined : JSON.stringify(v_4d33b2),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, boolean>>() };
}

v_469bf2("notification prefs", () => {
  v_23805a("기본값: 카테고리 3종 ON, 혜택(마케팅) OFF", async () => {
    const v_9edd60 = await v_21cc31(await v_bfb240());
    const v_cb35cb = await v_51c3d2("GET", v_9edd60);
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json).toEqual({ newFollower: true, followingActivity: true, reactions: true, intimacy: true, moderation: true, messages: true, promotions: false });
  });

  v_23805a("PUT 부분 갱신 + 혜택 ON 은 marketing_consent 와 동의 이력에 반영", async () => {
    const v_43e90c = await v_bfb240();
    const v_9edd60 = await v_21cc31(v_43e90c);
    const v_cb35cb = await v_51c3d2("PUT", v_9edd60, { reactions: false, promotions: true });
    v_4d37e3(v_cb35cb.json).toEqual({ newFollower: true, followingActivity: true, reactions: false, intimacy: true, moderation: true, messages: true, promotions: true });
    const v_ceb55a = await v_a1651b().prepare("SELECT marketing_consent AS m FROM users WHERE id = ?").bind(v_43e90c).first<{ m: number }>();
    v_4d37e3(v_ceb55a?.m).toBe(1);
    const v_3e58a1 = await v_a1651b()
      .prepare("SELECT COUNT(*) AS n FROM user_consent_log WHERE user_id = ? AND consent_type = 'marketing'")
      .bind(v_43e90c)
      .first<{ n: number }>();
    v_4d37e3(v_3e58a1?.n).toBe(1);
  });

  v_23805a("카테고리 OFF 면 해당 타입 푸시 차단, 다른 타입·매핑 없는 타입은 허용", async () => {
    const v_43e90c = await v_bfb240();
    const v_9edd60 = await v_21cc31(v_43e90c);
    await v_51c3d2("PUT", v_9edd60, { newFollower: false });
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "user_follow")).toBe(false);
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "clone_like")).toBe(true);
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "moderation")).toBe(true);
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "invite_received")).toBe(true);
    await v_51c3d2("PUT", v_9edd60, { intimacy: false, moderation: false });
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "intimacy_score")).toBe(false);
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "moderation")).toBe(false);
    await v_51c3d2("PUT", v_9edd60, { reactions: false });
    for (const v_357868 of ["clone_like", "clone_comment", "clone_follow", "clone_gift"]) {
      v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, v_357868)).toBe(false);
    }
    v_4d37e3(await v_5f5ee2(v_c9c489 as never, v_43e90c, "followee_new_clone")).toBe(true);
  });
});
