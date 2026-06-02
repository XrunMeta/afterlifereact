import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

async function v_2f5367(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

const v_097139 = "http://orchestrator.test";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("POST /oth-path", () => {
  v_23805a("relays profile to gabia and returns intro", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    v_8fd90d
      .get(v_097139)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { intro: "정 많은 할아버지예요. #추모 #할아버지" });
    const v_ea333d = await v_2f5367(90);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "할배", relation: "grandfather", personaAnswers: { tone: "사투리" } }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ intro: string }>();
    v_4d37e3(v_4d33b2.intro).toContain("#추모");
  });

  v_23805a("returns empty intro when gabia fails (no throw)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    v_8fd90d
      .get(v_097139)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(502, "err");
    const v_ea333d = await v_2f5367(90);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "할배" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3((await v_8f00b9.json<{ intro: string }>()).intro).toBe("");
  });

  v_23805a("401 without token", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", { method: "POST" });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
