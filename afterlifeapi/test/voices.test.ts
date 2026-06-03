import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

v_469bf2("GET /oth-path", () => {
  v_23805a("활성 음색만 sort_order 순으로 반환, 고민주 #0", async () => {
    const v_0c8987 = await v_bfb240("voices1@test.com");
    const v_21cc31 = await v_86c39f(v_0c8987);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{
      voices: Array<{ id: number; name: string; sampleUrl: string; sortOrder: number }>;
    }>();
    v_4d37e3(v_4d33b2.voices.length).toBeGreaterThanOrEqual(1);
    v_4d37e3(v_4d33b2.voices[0].name).toBe("고민주");
    v_4d37e3(v_4d33b2.voices[0].sortOrder).toBe(0);
    v_4d37e3(v_4d33b2.voices[0].sampleUrl).toContain("/sample");

    v_4d37e3(v_4d33b2.voices.some((v_81e2ef) => v_81e2ef.sampleUrl.includes("/samples/voice_"))).toBe(false);
  });
});

v_469bf2("GET /oth-path", () => {
  v_23805a("R2 객체 없으면 404 (라우트 동작 검증)", async () => {

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(404);
  });
  v_23805a("id=0 잘못된 id — 422 (VALIDATION_FAILED)", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});

v_469bf2("createClone voice_preset_id 검증", () => {
  v_23805a("비활성/없는 voice_preset_id 거부 — 400", async () => {
    const v_0c8987 = await v_bfb240("voices2@test.com");
    const v_21cc31 = await v_86c39f(v_0c8987);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_21cc31}`,
        "Content-Type": "application/json",
        "idempotency-key": `vp-test-${Date.now()}`,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "V",
        username: `vp${Date.now()}`,
        voice_preset_id: 999999,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });
});
