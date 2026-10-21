

import { v_469bf2, v_23805a, v_4d37e3, v_719203, v_3889c0 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b2eae5 } from "../src/lib/jwt";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8).run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}
async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
              VALUES (?, 'C', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427).run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}
async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?)`)
    .bind(v_43e90c, v_6e0fd3, v_1833e7, Date.now()).run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_bff046(v_21cc31, v_6e0fd3, v_ca1ec5): Promise<Record<string, unknown>> {
  let v_74e259 = {};
  const v_85caad = globalThis.fetch;
  v_3889c0.spyOn(globalThis, "fetch").mockImplementation(async (v_bbda62, v_00cfc6) => {
    const v_f71b56 = typeof v_bbda62 === "string" ? v_bbda62 : v_bbda62 instanceof URL ? v_bbda62.toString() : (v_bbda62 as Request).url;
    if (v_f71b56.includes("/oth-path")) {
      v_74e259 = JSON.parse(String(v_00cfc6?.body));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return v_85caad(v_bbda62 as RequestInfo, v_00cfc6);
  });
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: "안녕", clone_id: v_6e0fd3, active_person_id: v_ca1ec5 }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
  return v_74e259;
}

v_469bf2("viseme chat remembered_name 범위 (AFL-1030)", () => {
  v_719203(() => v_3889c0.restoreAllMocks());

  v_23805a("정상(같은 user x clone person) → remembered_name 주입, 다른 계정/다른 클론 person → 미주입", async () => {
    const v_b32680 = await v_bfb240("oth-staff@example.invalid");
    const v_a9cbf1 = await v_bfb240("afl1030-viseme-other@test.local");
    const v_c521ce = await v_4d24a9(v_b32680, "afl1030-viseme-a");
    const v_65cfbc = await v_4d24a9(v_b32680, "afl1030-viseme-b");
    const v_1c1268 = await v_2f0be6(v_b32680, v_c521ce, "내이름");
    const v_0cb08c = await v_2f0be6(v_a9cbf1, v_c521ce, "타계정이름");
    const v_8bc2aa = await v_2f0be6(v_b32680, v_65cfbc, "타클론이름");
    const v_21cc31 = await v_b2eae5({ sub: v_b32680, kind: "access" }, (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 3600);

    v_4d37e3((await v_bff046(v_21cc31, v_c521ce, v_1c1268)).remembered_name).toBe("내이름");
    v_4d37e3((await v_bff046(v_21cc31, v_c521ce, v_0cb08c)).remembered_name).toBeUndefined();
    v_4d37e3((await v_bff046(v_21cc31, v_c521ce, v_8bc2aa)).remembered_name).toBeUndefined();
  });
});
