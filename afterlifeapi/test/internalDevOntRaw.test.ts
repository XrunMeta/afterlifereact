import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489, v_1df298 } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";
const v_9542f7 = v_c9c489 as unknown as v_273a0c;
const v_7169b4 = v_9542f7.DEV_SECRET;   

async function v_bdb39e(v_6e0fd3, v_43e90c) {

  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
  ).bind(v_43e90c, `testuser${v_43e90c}@test.test`).run();
  await v_9542f7.DB.prepare(
    `INSERT OR REPLACE INTO clones (id, owner_id, name, username, clone_type, visibility, l1_profile)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(v_6e0fd3, v_43e90c, "테스트클론", `u${v_6e0fd3}`, "memlow", "public", JSON.stringify({ tone: "다정함" })).run();
  await v_9542f7.DB.prepare("INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())")
    .bind(v_6e0fd3, v_43e90c, JSON.stringify({ relation: "손녀", address: "서울", _meta: { rev: 3 } })).run();
  await v_9542f7.KV_ONT.delete(`l2:${v_6e0fd3}:${v_43e90c}`);
}
const v_38715b = (v_389afb, v_0c8987, v_ea333d) =>
  v_1df298.fetch(`https://x/oth-path${v_389afb}/ont-raw?userId=${v_0c8987}`, {
    headers: v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {},
  });

v_469bf2("GET /oth-path", () => {
  v_23805a("DEV_SECRET 정상 → data 원문+l1_profile+l2_consumed", async () => {
    await v_bdb39e(7301, 6301);
    const v_cb35cb = await v_38715b(7301, 6301, v_7169b4);
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_148ff6 = await v_cb35cb.json() as any;
    v_4d37e3(v_148ff6.data.relation).toBe("손녀");
    v_4d37e3(v_148ff6.data.address).toBe("서울");           
    v_4d37e3(v_148ff6.data._meta.rev).toBe(3);
    v_4d37e3(v_148ff6.l1_profile.tone).toBe("다정함");
    v_4d37e3(v_148ff6.l2_consumed.relation).toBe("손녀");    
    v_4d37e3(v_148ff6.l2_consumed.address).toBeUndefined();  
  });
  v_23805a("시크릿 불일치 → 401", async () => {
    await v_bdb39e(7302, 6302);
    v_4d37e3((await v_38715b(7302, 6302, "wrong")).status).toBe(401);
  });
  v_23805a("시크릿 없음 → 401", async () => {
    v_4d37e3((await v_38715b(7302, 6302)).status).toBe(401);
  });
  v_23805a("userId 누락 → 400", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path`, { headers: { Authorization: `Bearer ${v_7169b4}` } });
    v_4d37e3(v_cb35cb.status).toBe(400);
  });
});
