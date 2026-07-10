import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function seedUserWithToken(email: string): Promise<{ id: number; token: string }> {
  const { hashPassword } = await import("../src/lib/password");
  await (env as any).DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
  ).bind(email, await hashPassword("Passw0rd!!")).run();
  const u = await (env as any).DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Passw0rd!!" }),
  });
  const token = (await res.json<{ accessToken: string }>()).accessToken;
  return { id: u!.id, token };
}

async function createPerson(token: string, body: Record<string, unknown> = {}): Promise<number> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const { id } = (await res.json()) as { id: number };
  return id;
}

describe("PATCH /oth-path", () => {
  it("displayName 갱신 성공 → 200 + D1 반영", async () => {
    const { token } = await seedUserWithToken("patch-ok@test.test");
    const personId = await createPerson(token);
    const res = await SELF.fetch(`http://localhost/oth-path${personId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "민지" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: number; displayName: string };
    expect(body.displayName).toBe("민지");
    const row = await (env as any).DB.prepare("SELECT display_name FROM persons WHERE id = ?")
      .bind(personId).first<{ display_name: string }>();
    expect(row?.display_name).toBe("민지");
  });

  it("빈 문자열/31자 초과 → 422", async () => {
    const { token } = await seedUserWithToken("patch-bad@test.test");
    const personId = await createPerson(token);
    const empty = await SELF.fetch(`http://localhost/oth-path${personId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "  " }),
    });
    expect(empty.status).toBe(422);
    const tooLong = await SELF.fetch(`http://localhost/oth-path${personId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "가".repeat(31) }),
    });
    expect(tooLong.status).toBe(422);
  });

  it("타인 소유 person → 404", async () => {
    const owner = await seedUserWithToken("patch-owner@test.test");
    const attacker = await seedUserWithToken("patch-attacker@test.test");
    const personId = await createPerson(owner.token);
    const res = await SELF.fetch(`http://localhost/oth-path${personId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${attacker.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "철수" }),
    });
    expect(res.status).toBe(404);
  });

  it("미인증 → 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "철수" }),
    });
    expect(res.status).toBe(401);
  });
});
