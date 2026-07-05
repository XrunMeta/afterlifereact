import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

async function v_d33950(v_e0c7e8): Promise<{ id: number; token: string }> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await v_9542f7.DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_e0c7e8, await v_54846c("Passw0rd!!")).run();
  const v_ceb55a = await v_9542f7.DB.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: "Passw0rd!!" }),
  });
  const v_21cc31 = (await v_8f00b9.json<{ accessToken: string }>()).accessToken;
  return { id: v_ceb55a!.id, token: v_21cc31 };
}

v_469bf2("POST /oth-path", () => {
  v_23805a("미인증 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("granted → users 스냅샷 1 + user_consent_log append", async () => {
    const { id: v_389afb, token: v_21cc31 } = await v_d33950("consent_grant@test.test");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", termsVersion: "v1", channel: "signup" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_ceb55a = await v_9542f7.DB.prepare("SELECT call_learning_consent AS c, call_learning_consent_at AS at FROM users WHERE id = ?")
      .bind(v_389afb).first<{ c: number; at: number | null }>();
    v_4d37e3(v_ceb55a!.c).toBe(1);
    v_4d37e3(typeof v_ceb55a!.at).toBe("number");
    const v_3e58a1 = await v_9542f7.DB.prepare(
      "SELECT state, terms_version, channel FROM user_consent_log WHERE user_id = ? AND consent_type = 'call_learning'",
    ).bind(v_389afb).all<{ state: string; terms_version: string; channel: string }>();
    v_4d37e3(v_3e58a1.results).toHaveLength(1);
    v_4d37e3(v_3e58a1.results[0]).toMatchObject({ state: "granted", terms_version: "v1", channel: "signup" });
  });

  v_23805a("revoked → 스냅샷 0 + 로그 2행(감사 누적)", async () => {
    const { id: v_389afb, token: v_21cc31 } = await v_d33950("consent_revoke@test.test");
    const v_4f438a = (v_b6e533) => v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: v_b6e533, channel: "settings" }),
    });
    await v_4f438a("granted");
    await v_4f438a("revoked");
    const v_ceb55a = await v_9542f7.DB.prepare("SELECT call_learning_consent AS c FROM users WHERE id = ?").bind(v_389afb).first<{ c: number }>();
    v_4d37e3(v_ceb55a!.c).toBe(0);
    const v_3e58a1 = await v_9542f7.DB.prepare("SELECT COUNT(*) AS n FROM user_consent_log WHERE user_id = ?").bind(v_389afb).first<{ n: number }>();
    v_4d37e3(v_3e58a1!.n).toBe(2);
  });

  v_23805a("잘못된 state → 422 (VALIDATION_FAILED)", async () => {
    const { token: v_21cc31 } = await v_d33950("consent_bad@test.test");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "maybe" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});

v_469bf2("GET /oth-path", () => {
  v_23805a("현재 동의 상태 반환", async () => {
    const { token: v_21cc31 } = await v_d33950("consent_get@test.test");
    await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", channel: "settings" }),
    });
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = await v_8f00b9.json<{ call_learning: { state: string } }>();
    v_4d37e3(v_7ecfd1.call_learning.state).toBe("granted");
  });
});
