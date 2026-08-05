import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedClone(ownerId: number, username: string): Promise<number> {
  await E.DB.prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(ownerId, username).run();
  const c = await E.DB.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

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

describe("POST /oth-path", () => {
  it("미인증 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });
    expect(res.status).toBe(401);
  });

  it("granted → users 스냅샷 1 + face_consent_version 기록 + user_consent_log append", async () => {
    const { id, token } = await seedUserWithToken("face_consent_grant@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", termsVersion: "v1", channel: "signup" }),
    });
    expect(res.status).toBe(200);
    const u = await E.DB.prepare(
      "SELECT face_biometric_consent AS c, face_consent_at AS at, face_consent_version AS v FROM users WHERE id = ?",
    ).bind(id).first<{ c: number; at: number | null; v: string | null }>();
    expect(u!.c).toBe(1);
    expect(typeof u!.at).toBe("number");
    expect(u!.v).toBe("v1");
    const log = await E.DB.prepare(
      "SELECT state, terms_version, channel FROM user_consent_log WHERE user_id = ? AND consent_type = 'face_biometric'",
    ).bind(id).all<{ state: string; terms_version: string; channel: string }>();
    expect(log.results).toHaveLength(1);
    expect(log.results[0]).toMatchObject({ state: "granted", terms_version: "v1", channel: "signup" });
  });

  it("잘못된 state → 422 (VALIDATION_FAILED)", async () => {
    const { token } = await seedUserWithToken("face_consent_bad@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "maybe" }),
    });
    expect(res.status).toBe(422);
  });

  it("revoked → auto_biometric person만 연쇄 삭제, card person 보존", async () => {
    const { id: userId, token } = await seedUserWithToken("face_consent_revoke@test.test");

    await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", termsVersion: "v1", channel: "signup" }),
    });

    const cloneId = await seedClone(userId, "face-consent-revoke-clone");
    const autoRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, enrolledVia: "auto_biometric" }),
    });
    const { id: autoPersonId } = (await autoRes.json()) as { id: number };
    const cardRes = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, displayName: "카드등록" }),
    });
    const { id: cardPersonId } = (await cardRes.json()) as { id: number };
    await SELF.fetch(`http://localhost/oth-path${cardPersonId}/consent`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted" }),
    });

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "revoked", termsVersion: "v1", channel: "settings" }),
    });
    expect(res.status).toBe(200);

    const u = await E.DB.prepare("SELECT face_biometric_consent AS c FROM users WHERE id = ?").bind(userId).first<{ c: number }>();
    expect(u!.c).toBe(0);

    const autoCount = await E.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(autoPersonId).first<{ c: number }>();
    expect(autoCount?.c).toBe(0); 

    const cardCount = await E.DB.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(cardPersonId).first<{ c: number }>();
    expect(cardCount?.c).toBe(1); 
  });

  it("revoked인데 auto_biometric person이 없으면 no-op으로 200", async () => {
    const { token } = await seedUserWithToken("face_consent_revoke_empty@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "revoked", termsVersion: "v1" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /oth-path — face_biometric 필드", () => {
  it("동의 전 기본값 {state:'none', at:null, version:null}", async () => {
    const { token } = await seedUserWithToken("face_consent_get_default@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json<{ face_biometric: { state: string; at: number | null; version: string | null } }>();
    expect(json.face_biometric).toEqual({ state: "none", at: null, version: null });
  });

  it("동의 후 {state:'granted', version:'v1'}", async () => {
    const { token } = await seedUserWithToken("face_consent_get_granted@test.test");
    await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "granted", termsVersion: "v1" }),
    });
    const res = await SELF.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json<{ face_biometric: { state: string; version: string | null } }>();
    expect(json.face_biometric.state).toBe("granted");
    expect(json.face_biometric.version).toBe("v1");
  });

  it("call_learning 필드는 기존 그대로(회귀 확인)", async () => {
    const { token } = await seedUserWithToken("face_consent_regress@test.test");
    const res = await SELF.fetch("http://localhost/oth-path", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json<{ call_learning: { state: string; at: number | null } }>();
    expect(json.call_learning).toEqual({ state: "none", at: null });
  });
});
