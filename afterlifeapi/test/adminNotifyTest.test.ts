import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_21cc31(v_f91f33): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_f91f33, v_43fd42, 600);
}

async function v_bfb240(v_9b82b4): Promise<{ id: number; email: string }> {
  const v_e0c7e8 = `notify-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, xrun_member_id, created_at) VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_9b82b4)
    .run();
  const v_389afb = (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
  return { id: v_389afb, email: v_e0c7e8 };
}

v_469bf2("admin notify-test", () => {
  v_23805a("이메일·xrun 회원번호로 대상 조회 + 기본 알림 설정", async () => {
    const v_ceb55a = await v_bfb240(771001);
    const v_020893 = await v_21cc31({ sub: 99996, kind: "access", admin: true });
    for (const v_ab6401 of [v_ceb55a.email, "x771001", String(v_ceb55a.id)]) {
      const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path?q=${encodeURIComponent(v_ab6401)}`, {
        headers: { Authorization: `Bearer ${v_020893}` },
      });
      v_4d37e3(v_8f00b9.status).toBe(200);
      const v_b75e36 = await v_8f00b9.json<{ user: { id: number }; prefs: Record<string, boolean> }>();
      v_4d37e3(v_b75e36.user.id).toBe(v_ceb55a.id);
      v_4d37e3(v_b75e36.prefs).toEqual({ newFollower: true, followingActivity: true, reactions: true, intimacy: true, moderation: true, promotions: false });
    }
  });

  v_23805a("test-notify: 인앱 기록 + 카테고리 OFF 면 pushAllowed=false", async () => {
    const v_ceb55a = await v_bfb240(771002);
    const v_020893 = await v_21cc31({ sub: 99996, kind: "access", admin: true });
    const v_9c423d = async (v_3b27d9) => {
      const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_ceb55a.id}/test-notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_020893}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: v_3b27d9 }),
      });
      return { status: v_8f00b9.status, json: await v_8f00b9.json<{ inserted: boolean; pushAllowed: boolean }>() };
    };
    let v_cb35cb = await v_9c423d("user_follow");
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json.inserted).toBe(true);
    v_4d37e3(v_cb35cb.json.pushAllowed).toBe(true);

    await v_a1651b()
      .prepare(`INSERT INTO user_notification_prefs (user_id, new_follower, following_activity, reactions, updated_at) VALUES (?, 0, 1, 1, ?)`)
      .bind(v_ceb55a.id, Date.now())
      .run();
    v_cb35cb = await v_9c423d("user_follow");
    v_4d37e3(v_cb35cb.json.inserted).toBe(true);
    v_4d37e3(v_cb35cb.json.pushAllowed).toBe(false);

    v_4d37e3((await v_9c423d("not_a_type")).status).toBe(422);
  });
});
