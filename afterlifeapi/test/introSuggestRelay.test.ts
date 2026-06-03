import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

async function userTok(uid: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await issueToken({ sub: uid, kind: "access" }, secret, 600);
}

const ORCH_URL = "http://orchestrator.test";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("POST /oth-path", () => {
  it("relays profile to gabia and returns intro", async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    fetchMock
      .get(ORCH_URL)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { intro: "정 많은 할아버지예요. #추모 #할아버지" });
    const tok = await userTok(90);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "할배", relation: "grandfather", personaAnswers: { tone: "사투리" } }),
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ intro: string }>();
    expect(body.intro).toContain("#추모");
  });

  it("returns empty intro when gabia fails (no throw)", async () => {
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
    expect((await res.json<{ intro: string }>()).intro).toBe("");
  });

  it("401 without token", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", { method: "POST" });
    expect(res.status).toBe(401);
  });
});
