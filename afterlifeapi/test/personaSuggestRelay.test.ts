import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_2f5367(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

v_469bf2("GET /oth-path", () => {
  v_23805a("returns the question schema for an authed user", async () => {

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (90,'w@t','x','W',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ea333d = await v_2f5367(90);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ questions: { key: string }[] }>();
    v_4d37e3(Array.isArray(v_4d33b2.questions)).toBe(true);

    v_4d37e3(v_4d33b2.questions.some((v_ab6401) => v_ab6401.key === "tone")).toBe(true);
  });

  v_23805a("401 without token", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
