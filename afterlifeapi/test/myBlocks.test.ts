import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `mb-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_556427 = `mb_clone_${v_1923e2}`;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_04b58a(v_9fe22d, v_21cc31, v_bfe9b9 = "GET"): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
}

interface BlockItem {
  type: "clone" | "user";
  blockId: number;
  clone?: { id: number };
  user?: { id: number; email: string };
}

v_469bf2("GET /oth-path — 클론 + 유저 통합", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM clone_blocks").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("차단한 클론과 유저가 모두 type 판별자와 함께 반환됨", async () => {
    const v_b32680 = await v_bfb240();
    const v_a9cbf1 = await v_bfb240(); 
    const v_e4606f = await v_bfb240();
    const v_6e0fd3 = await v_4d24a9(v_e4606f); 
    const v_21cc31 = await v_86c39f(v_b32680);

    v_4d37e3((await v_04b58a(`/oth-path${v_6e0fd3}/block`, v_21cc31, "POST")).status).toBe(200);
    v_4d37e3((await v_04b58a(`/oth-path${v_a9cbf1}/block`, v_21cc31, "POST")).status).toBe(200);

    const v_8f00b9 = await v_04b58a(`/oth-path`, v_21cc31);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { items: BlockItem[] };

    const v_e44122 = v_7ecfd1.items.find((v_ebec57) => v_ebec57.type === "clone");
    const v_2539b3 = v_7ecfd1.items.find((v_ebec57) => v_ebec57.type === "user");
    v_4d37e3(v_e44122?.clone?.id).toBe(v_6e0fd3);
    v_4d37e3(v_2539b3?.user?.id).toBe(v_a9cbf1);
    v_4d37e3(v_7ecfd1.items.length).toBeGreaterThanOrEqual(2);
  });

  v_23805a("유저 신고(자동 차단)도 /me/blocks 에 type:user 로 노출", async () => {
    const v_b32680 = await v_bfb240();
    const v_5f5d6d = await v_bfb240();
    const v_21cc31 = await v_86c39f(v_b32680);

    v_4d37e3((await v_04b58a(`/oth-path${v_5f5d6d}/report`, v_21cc31, "POST")).status).toBe(200);

    const v_8f00b9 = await v_04b58a(`/oth-path`, v_21cc31);
    const v_7ecfd1 = (await v_8f00b9.json()) as { items: BlockItem[] };
    const v_2539b3 = v_7ecfd1.items.find((v_ebec57) => v_ebec57.type === "user" && v_ebec57.user?.id === v_5f5d6d);
    v_4d37e3(v_2539b3).toBeTruthy();
  });
});
