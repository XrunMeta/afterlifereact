import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(`gal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_e15ece(v_43e90c, v_28c2de): Promise<void> {
  let v_8d41d7 = 1_700_000_000;
  for (const v_94302c of v_28c2de) {
    await v_a1651b()
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, kind, gift_id, count, xrun_amount, created_at) VALUES (?, ?, 'rose', 2, 0, ?)`,
      )
      .bind(v_43e90c, v_94302c, v_8d41d7++)
      .run();
  }
}

async function v_38715b(v_43e90c, v_212049) {
  const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_212049}`, {
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
}

v_469bf2("GET /oth-path kind filter", () => {
  v_23805a("received = received+ad_reward, sent = sent, 페이지·total·totalSent", async () => {
    const v_ceb55a = await v_bfb240();
    await v_e15ece(v_ceb55a, [
      ...Array(17).fill("received"),
      "ad_reward",
      ...Array(3).fill("sent"),
      "exchanged",
    ]);

    const v_2d1eeb = await v_38715b(v_ceb55a, "?kind=received&limit=15");
    v_4d37e3(v_2d1eeb.status).toBe(200);
    v_4d37e3(v_2d1eeb.json.items).toHaveLength(15);
    v_4d37e3(v_2d1eeb.json.total).toBe(18);
    v_4d37e3(v_2d1eeb.json.items.every((v_ebec57) => v_ebec57.kind === "received" || v_ebec57.kind === "ad_reward")).toBe(true);

    const v_b96973 = await v_38715b(v_ceb55a, "?kind=received&limit=15&offset=15");
    v_4d37e3(v_b96973.json.items).toHaveLength(3);
    const v_52e08b = new Set([...v_2d1eeb.json.items, ...v_b96973.json.items].map((v_ebec57) => v_ebec57.id));
    v_4d37e3(v_52e08b.size).toBe(18);

    const v_fd5f43 = await v_38715b(v_ceb55a, "?kind=sent&limit=15");
    v_4d37e3(v_fd5f43.json.items).toHaveLength(3);
    v_4d37e3(v_fd5f43.json.items.every((v_ebec57) => v_ebec57.kind === "sent")).toBe(true);
    v_4d37e3(v_fd5f43.json.total).toBe(3);
    v_4d37e3(v_fd5f43.json.totalSent).toBe(6);

    const v_48c915 = await v_38715b(v_ceb55a, "?limit=200");
    v_4d37e3(v_48c915.json.total).toBe(22);
  });

  v_23805a("알 수 없는 kind 는 전부로 취급", async () => {
    const v_ceb55a = await v_bfb240();
    await v_e15ece(v_ceb55a, ["received", "sent"]);
    for (const v_0eb677 of ["constructor", "__proto__", "bogus"]) {
      const v_cb35cb = await v_38715b(v_ceb55a, `?kind=${v_0eb677}`);
      v_4d37e3(v_cb35cb.status).toBe(200);
      v_4d37e3(v_cb35cb.json.total).toBe(2);
    }
  });
});
