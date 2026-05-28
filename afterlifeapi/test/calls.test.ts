import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

const v_8fe3be = "http://orchestrator.test";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("calls route", () => {
  v_23805a("POST /oth-path — owner 는 200 + 티켓(subscribeToken 포함)", async () => {
    const v_257b90 = await v_bfb240("call-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_owner");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "abcd1234-ef",
        subscribeToken: "secret-tok",
        tracks: { video: "v-abcd1234", audio: "a-abcd1234" },
        state: "live",
      });

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      callId: string;
      subscribeUrl: string;
      renegotiateUrl: string;
      subscribeToken: string;
    };
    v_4d37e3(v_4d33b2.callId).toBe("abcd1234-ef");
    v_4d37e3(v_4d33b2.subscribeUrl).toBe(`${v_8fe3be}/oth-path`);
    v_4d37e3(v_4d33b2.renegotiateUrl).toBe(`${v_8fe3be}/oth-path`);
    v_4d37e3(v_4d33b2.subscribeToken).toBe("secret-tok");
  });

  v_23805a("POST /oth-path — 비로그인 401", async () => {
    const v_257b90 = await v_bfb240("call-anon@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_anon");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, { method: "POST" });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("POST /oth-path — 없는 clone 404", async () => {
    const v_257b90 = await v_bfb240("call-404@test.local");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("POST /oth-path — orchestrator no_capacity → 503", async () => {
    const v_257b90 = await v_bfb240("call-503@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_503");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d.get(v_8fe3be).intercept({ path: "/oth-path", method: "POST" }).reply(503, { error: "no_capacity" });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(503);
  });

  v_23805a("POST /oth-path — 멱등 200", async () => {
    const v_257b90 = await v_bfb240("call-end@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_end");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d.get(v_8fe3be).intercept({ path: "/oth-path", method: "DELETE" }).reply(200, { ok: true });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/xyz/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
  });
});
