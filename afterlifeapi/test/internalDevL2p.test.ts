import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;
const v_7169b4 = v_9542f7.DEV_SECRET; 

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
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
    .bind(v_43e90c, v_6e0fd3, v_1833e7, Date.now())
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

function v_c599b8(v_6e0fd3, v_ca1ec5, v_ea333d) {
  return v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/l2p-raw?personId=${v_ca1ec5}`, {
    headers: v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {},
  });
}

function v_92c239(v_6e0fd3, v_4d33b2, v_ea333d) {
  return v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/ont-merge-person`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {}),
    },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2("dev person l2p endpoints", () => {
  let v_43e90c, v_6e0fd3, v_ca1ec5;

  v_ba7107(async () => {
    v_43e90c = await v_bfb240("dev-l2p-person@test.local");
    v_6e0fd3 = await v_4d24a9(v_43e90c, "dev-l2p-person-clone");
    v_ca1ec5 = await v_2f0be6(v_43e90c, v_6e0fd3, "형");
  });

  v_23805a("l2p-raw 401 without DEV_SECRET", async () => {
    const v_cb35cb = await v_c599b8(v_6e0fd3, v_ca1ec5);
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("l2p-raw returns null data before learning + displayName", async () => {
    const v_cb35cb = await v_c599b8(v_6e0fd3, v_ca1ec5, v_7169b4);
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_148ff6 = await v_cb35cb.json<{ data: unknown; displayName: string | null }>();
    v_4d37e3(v_148ff6.data).toBeNull();
    v_4d37e3(v_148ff6.displayName).toBe("형");
  });

  v_23805a("ont-merge-person writes then l2p-raw reflects it", async () => {
    const v_35f85c = await v_92c239(
      v_6e0fd3,
      { personId: v_ca1ec5, source: "chat", extracted: { relation: "형", preference_personal: { 음료: "아메리카노" } } },
      v_7169b4,
    );
    v_4d37e3(v_35f85c.status).toBe(200);
    const v_6c6b11 = await v_35f85c.json<{ rev: number; skipped: boolean; data: { relation?: string } }>();
    v_4d37e3(v_6c6b11.skipped).toBe(false);
    v_4d37e3(v_6c6b11.data.relation).toBe("형");

    const v_cb35cb = await v_c599b8(v_6e0fd3, v_ca1ec5, v_7169b4);
    const v_148ff6 = await v_cb35cb.json<{ data: { relation?: string; preference_personal?: Record<string, unknown> } | null }>();
    v_4d37e3(v_148ff6.data?.relation).toBe("형");
    v_4d37e3(v_148ff6.data?.preference_personal?.음료).toBe("아메리카노");
  });

  v_23805a("ont-merge-person 404 for unknown person", async () => {
    const v_35f85c = await v_92c239(
      v_6e0fd3,
      { personId: 999999, source: "chat", extracted: { relation: "x" } },
      v_7169b4,
    );
    v_4d37e3(v_35f85c.status).toBe(404);
  });

  v_23805a("ont-merge-person 404 for unknown clone", async () => {
    const v_35f85c = await v_92c239(
      999998,
      { personId: v_ca1ec5, source: "chat", extracted: { relation: "x" } },
      v_7169b4,
    );
    v_4d37e3(v_35f85c.status).toBe(404);
  });

  v_23805a("ont-merge-person 401 without DEV_SECRET", async () => {
    const v_35f85c = await v_92c239(v_6e0fd3, { personId: v_ca1ec5, source: "chat", extracted: {} });
    v_4d37e3(v_35f85c.status).toBe(401);
  });
});
