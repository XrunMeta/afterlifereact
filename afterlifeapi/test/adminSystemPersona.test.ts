import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_d72b33 = 9001; 

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

async function v_5d5cfb(): Promise<string> {
  return v_b2eae5({ sub: v_d72b33, kind: "access", admin: true });
}

async function v_c580ed(): Promise<string> {

  return v_b2eae5({ sub: 99999, kind: "access", admin: true });
}

v_ba7107(async () => {

  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-test@afterlife.test", "hashed-placeholder")
    .run();
});

v_469bf2("admin system-persona", () => {

  v_23805a("GET returns current L0 (regular admin token)", async () => {
    const v_ea333d = await v_c580ed();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ rules_text: string; blocklist: string[] }>();
    v_4d37e3(typeof v_4d33b2.rules_text).toBe("string");
    v_4d37e3(Array.isArray(v_4d33b2.blocklist)).toBe(true);
  });

  v_23805a("PUT updates rules_text and blocklist (super_admin token)", async () => {
    const v_ea333d = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "새 규칙입니다.", blocklist: ["욕설"] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id=1")
      .first<{ rules_text: string; blocklist: string }>();
    v_4d37e3(v_3ac7e7!.rules_text).toBe("새 규칙입니다.");
    v_4d37e3(JSON.parse(v_3ac7e7!.blocklist)).toEqual(["욕설"]);
  });

  v_23805a("PUT rejects non-superadmin (regular admin token → 403)", async () => {
    const v_ea333d = await v_c580ed();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "침투 시도", blocklist: [] }),
    });

    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });

  v_23805a("PUT rejects rules_text over 8000 chars (super_admin token)", async () => {
    const v_ea333d = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PUT",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rules_text: "a".repeat(8001), blocklist: [] }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toBe("rules_text_too_long");
  });

  v_23805a("GET rejects missing token (no Authorization header → 401)", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
