import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedUserWithToken(email: string): Promise<{ id: number; token: string }> {
  const { hashPassword } = await import("../src/lib/password");
  await E.DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
  ).bind(email, await hashPassword("Passw0rd!!")).run();
  const u = await E.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Passw0rd!!" }),
  });
  const token = (await res.json<{ accessToken: string }>()).accessToken;
  return { id: u!.id, token };
}

describe("POST /oth-path", () => {
  it("미인증 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });
    expect(res.status).toBe(401);
  });

  it("granted → users 스냅샷 1 + user_consent_log append", async () => {
    const { id, token } = await seedUserWithToken("consent_grant@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", termsVersion: "v1", channel: "signup" }),
    });
    expect(res.status).toBe(200);
    const u = await E.DB.prepare("SELECT call_learning_consent AS c, call_learning_consent_at AS at FROM users WHERE id = ?")
      .bind(id).first<{ c: number; at: number | null }>();
    expect(u!.c).toBe(1);
    expect(typeof u!.at).toBe("number");
    const log = await E.DB.prepare(
      "SELECT state, terms_version, channel FROM user_consent_log WHERE user_id = ? AND consent_type = 'call_learning'",
    ).bind(id).all<{ state: string; terms_version: string; channel: string }>();
    expect(log.results).toHaveLength(1);
    expect(log.results[0]).toMatchObject({ state: "granted", terms_version: "v1", channel: "signup" });
  });

  it("revoked → 스냅샷 0 + 로그 2행(감사 누적)", async () => {
    const { id, token } = await seedUserWithToken("consent_revoke@test.test");
    const post = (state: string) => SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, channel: "settings" }),
    });
    await post("granted");
    await post("revoked");
    const u = await E.DB.prepare("SELECT call_learning_consent AS c FROM users WHERE id = ?").bind(id).first<{ c: number }>();
    expect(u!.c).toBe(0);
    const log = await E.DB.prepare("SELECT COUNT(*) AS n FROM user_consent_log WHERE user_id = ?").bind(id).first<{ n: number }>();
    expect(log!.n).toBe(2);
  });

  it("잘못된 state → 422 (VALIDATION_FAILED)", async () => {
    const { token } = await seedUserWithToken("consent_bad@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "maybe" }),
    });
    expect(res.status).toBe(422);
  });
});

describe("GET /oth-path", () => {
  it("현재 동의 상태 반환", async () => {
    const { token } = await seedUserWithToken("consent_get@test.test");
    await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", channel: "settings" }),
    });
    const res = await SELF.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json<{ call_learning: { state: string } }>();
    expect(json.call_learning.state).toBe("granted");
  });
});
