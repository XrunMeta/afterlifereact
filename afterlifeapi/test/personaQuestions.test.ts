import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_02d529 } from "../src/lib/personaQuestions";

v_469bf2("validatePersonaQuestions", () => {
  v_23805a("accepts a valid schema with gemma_choice + fixed_choice + showWhen", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "gemma_choice", label: "말투?", targetField: "tone", options_include: ["사투리"] },
      { key: "dialect_region", type: "fixed_choice", label: "지역?", options: ["경상도"], showWhen: { tone: "사투리" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(true);
  });

  v_23805a("rejects duplicate keys", () => {
    const v_cb35cb = v_02d529([
      { key: "tone", type: "text", label: "a" },
      { key: "tone", type: "text", label: "b" },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("duplicate");
  });

  v_23805a("rejects unknown type", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "slider", label: "a" }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
  });

  v_23805a("rejects fixed_choice with empty options", () => {
    const v_cb35cb = v_02d529([{ key: "x", type: "fixed_choice", label: "a", options: [] }]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
  });

  v_23805a("rejects showWhen referencing a non-existent key", () => {
    const v_cb35cb = v_02d529([
      { key: "x", type: "text", label: "a", showWhen: { ghost: "v" } },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
    v_4d37e3(v_cb35cb.error).toContain("showWhen");
  });

  v_23805a("rejects non-array input", () => {
    v_4d37e3(v_02d529({} as unknown).ok).toBe(false);
  });
});

const v_d72b33 = 9001;

async function v_7c351e(v_f91f33): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5(v_f91f33, v_43fd42, 600);
}

async function v_09bcb2(): Promise<string> {
  return v_7c351e({ sub: v_d72b33, kind: "access", admin: true });
}

async function v_45f3c0(): Promise<string> {
  return v_7c351e({ sub: 99998, kind: "access", admin: true });
}

v_ba7107(async () => {

  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-pq-test@afterlife.test", "hashed-placeholder")
    .run();
});

v_469bf2("admin /persona-questions", () => {
  v_23805a("GET returns seeded schema", async () => {
    const v_ea333d = await v_45f3c0();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ questions: unknown[] }>();
    v_4d37e3(Array.isArray(v_4d33b2.questions)).toBe(true);
  });

  v_23805a("PUT rejects invalid schema with 400", async () => {
    const v_ea333d = await v_09bcb2();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "a", type: "slider", label: "x" }] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("PUT persists a valid schema", async () => {
    const v_ea333d = await v_09bcb2();
    const v_a448ad = [{ key: "tone", type: "text", label: "말투?" }];
    const v_4abc91 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: v_a448ad }),
    });
    v_4d37e3(v_4abc91.status).toBe(200);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b.prepare("SELECT schema_json FROM persoth-secretema WHERE id=1").first<{ schema_json: string }>();
    v_4d37e3(JSON.parse(v_3ac7e7!.schema_json)[0].key).toBe("tone");
  });

  v_23805a("PUT rejects non-super_admin (regular admin token → 401 or 403)", async () => {
    const v_ea333d = await v_45f3c0();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ questions: [{ key: "tone", type: "text", label: "a" }] }),
    });
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });
});
