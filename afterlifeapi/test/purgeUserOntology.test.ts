import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_344b9e, v_5729a9, v_3821c0, v_862be2, v_0761b1 } from "../src/lib/memoryStore";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

async function v_bfb240(v_389afb): Promise<void> {
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_389afb, `purge${v_389afb}@test.test`).run();
}
async function v_4d24a9(v_6e0fd3, v_1badb6): Promise<void> {
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(v_6e0fd3, v_1badb6, `pc${v_6e0fd3}`).run();
}
async function v_2f0be6(v_ca1ec5, v_43e90c, v_6e0fd3): Promise<void> {
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
     VALUES (?, ?, ?, 'P', unixepoch())`,
  ).bind(v_ca1ec5, v_43e90c, v_6e0fd3).run();
}

v_469bf2("purgeUserOntology", () => {
  v_23805a("해당 user의 clone_ont(전 클론)·KV_ONT를 하드 파기", async () => {
    await v_bfb240(7701); await v_4d24a9(9701, 7701); await v_4d24a9(9702, 7701);
    await v_5729a9(v_9542f7, 9701, 7701, JSON.stringify({ relation: "손녀" }), true);
    await v_5729a9(v_9542f7, 9702, 7701, JSON.stringify({ relation: "친구" }), true);
    await v_bfb240(7799); await v_5729a9(v_9542f7, 9701, 7799, JSON.stringify({ relation: "이웃" }), true);

    const v_8f00b9 = await v_344b9e(v_9542f7, 7701);
    v_4d37e3(v_8f00b9.ontRows).toBe(2);
    v_4d37e3(v_8f00b9.kvKeys).toBe(2);
    v_4d37e3(await v_3821c0(v_9542f7, 9701, 7701)).toBeNull();
    v_4d37e3(await v_3821c0(v_9542f7, 9702, 7701)).toBeNull();
    v_4d37e3(await v_9542f7.KV_ONT.get("l2:9701:7701")).toBeNull();
    v_4d37e3(await v_3821c0(v_9542f7, 9701, 7799)).not.toBeNull(); 
  });

  v_23805a("해당 user가 등록한 person의 clone_ont_person 파기", async () => {
    await v_bfb240(7702); await v_4d24a9(9703, 7702); await v_2f0be6(6601, 7702, 9703);
    await v_862be2(v_9542f7, 9703, 6601, JSON.stringify({ relation: "이웃" }), true);
    const v_8f00b9 = await v_344b9e(v_9542f7, 7702);
    v_4d37e3(v_8f00b9.personRows).toBe(1);
    v_4d37e3(await v_0761b1(v_9542f7, 9703, 6601)).toBeNull();
  });

  v_23805a("데이터 없는 user는 0건(멱등·throw 없음)", async () => {
    await v_bfb240(7703);
    const v_8f00b9 = await v_344b9e(v_9542f7, 7703);
    v_4d37e3(v_8f00b9).toEqual({ ontRows: 0, personRows: 0, kvKeys: 0 });
  });
});

v_469bf2("삭제 경로 통합", () => {
  async function v_79772b(v_e0c7e8, v_af05dc): Promise<{ id: number; token: string }> {
    const { hashPassword: v_54846c } = await import("../src/lib/password");
    await v_9542f7.DB.prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
    ).bind(v_e0c7e8, await v_54846c(v_af05dc)).run();
    const v_ceb55a = await v_9542f7.DB.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8)
      .first<{ id: number }>();
    const v_445b40 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: v_e0c7e8, password: v_af05dc }),
    });
    const v_21cc31 = (await v_445b40.json<{ accessToken: string }>()).accessToken;
    return { id: v_ceb55a!.id, token: v_21cc31 };
  }

  v_23805a("DELETE /oth-path 후 clone_ont 잔존 0", async () => {
    const { id: v_389afb, token: v_21cc31 } = await v_79772b("delme_ont@test.test", "Passw0rd!!");
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (9751, ?, 'CT', 'pcm751', 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(v_389afb).run();
    await v_5729a9(v_9542f7, 9751, v_389afb, JSON.stringify({ relation: "손녀" }), true);

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "DELETE", headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_3821c0(v_9542f7, 9751, v_389afb)).toBeNull();
  });

  v_23805a("POST /oth-path 후 clone_ont 잔존 0", async () => {
    const { id: v_389afb, token: v_21cc31 } = await v_79772b("delme_gdpr@test.test", "Passw0rd!!");
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (9752, ?, 'CT', 'pcm752', 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(v_389afb).run();
    await v_5729a9(v_9542f7, 9752, v_389afb, JSON.stringify({ relation: "친구" }), true);

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: "{}",
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_3821c0(v_9542f7, 9752, v_389afb)).toBeNull();
  });
});
