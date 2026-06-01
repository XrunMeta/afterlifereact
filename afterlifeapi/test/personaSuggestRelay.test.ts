import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

async function userTok(uid: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await issueToken({ sub: uid, kind: "access" }, secret, 600);
}

describe("GET /oth-path", () => {
  it("returns the question schema for an authed user", async () => {

    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ questions: { key: string }[] }>();
    expect(Array.isArray(body.questions)).toBe(true);

    expect(body.questions.some((q) => q.key === "tone")).toBe(true);
  });

  it("401 without token", async () => {
    const res = await SELF.fetch("http://localhost/oth-path");
    expect(res.status).toBe(401);
  });
});

const ORCH_URL = "http://orchestrator.test";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("POST /oth-path", () => {
  it("relays profile to gabia and returns suggestions", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    fetchMock
      .get(ORCH_URL)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { suggestions: { tone: ["A", "B", "C", "D"] } });
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "할배", relation: "할아버지", age: "60대" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ suggestions: { tone: string[] } }>();
    expect(body.suggestions.tone).toHaveLength(4);
  });

  it("returns empty suggestions when gabia fails (no throw)", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    fetchMock
      .get(ORCH_URL)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(502, "err");
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "할배" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ suggestions: Record<string, unknown> }>();
    expect(body.suggestions).toEqual({});
  });
});
