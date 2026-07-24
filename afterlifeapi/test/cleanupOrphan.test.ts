

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_09b071 } from "../src/scheduled/cleanup";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_a5302d = () => v_c9c489 as unknown as Parameters<typeof v_09b071>[0];
const v_300473 = () => crypto.randomUUID().slice(0, 8);

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  return (
    await v_a1651b().prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>()
  )!.id;
}

async function v_0b5942(v_1badb6, v_556427, v_f6ce15 = "-1 day"): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'C', ?, 'friend', 'public', datetime('now', ?)) RETURNING id`,
    )
    .bind(v_1badb6, v_556427, v_f6ce15)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_5ae6a6(v_389afb): Promise<string | null> {
  const v_cb35cb = await v_a1651b()
    .prepare(`SELECT deletion_state FROM clones WHERE id = ?`)
    .bind(v_389afb)
    .first<{ deletion_state: string }>();
  return v_cb35cb?.deletion_state ?? null;
}

v_469bf2("runCleanup — orphan sweep", () => {
  v_23805a("owner 유저가 존재하는 (공유 없는·5분 지난) 클론은 삭제하지 않는다 [버그 회귀]", async () => {
    const v_0c8987 = await v_bfb240(`owned_${v_300473()}@t.com`);
    const v_062ae9 = await v_0b5942(v_0c8987, `owned_${v_300473()}`);

    await v_09b071(v_a5302d());

    v_4d37e3(await v_5ae6a6(v_062ae9)).toBe("active");
  });

  v_23805a("모든 클론에 owner 가 있으면 orphan 을 하나도 찾지 않는다 (false-positive 0)", async () => {
    const v_0c8987 = await v_bfb240(`noorphan_${v_300473()}@t.com`);
    await v_0b5942(v_0c8987, `a_${v_300473()}`);
    await v_0b5942(v_0c8987, `b_${v_300473()}`);

    const v_43c42e = await v_09b071(v_a5302d());

    v_4d37e3(v_43c42e.orphansFound).toBe(0);
    v_4d37e3(v_43c42e.orphansSoftDeleted).toBe(0);
  });
});
