import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

interface ClonesRow { cnt: number }

async function v_2e4ad6(): Promise<boolean> {
  try {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof v_3ac7e7?.cnt === "number";
  } catch {
    return false;
  }
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(
  v_1badb6,
  v_556427,
  v_818579,
): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427, v_818579)
    .run();
  const v_3f4e2e = await v_a1651b
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(v_556427)
    .first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_fa006d(v_6e0fd3, v_b43b74): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, ?, null, null, CURRENT_TIMESTAMP)`,
    )
    .bind(v_6e0fd3, v_b43b74)
    .run();
  const v_8b5cd8 = await v_a1651b
    .prepare("SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1")
    .bind(v_6e0fd3)
    .first<{ id: number }>();
  return v_8b5cd8!.id;
}

v_469bf2("feeds route — contract", () => {
  v_ba7107(async () => {
    if (!(await v_2e4ad6())) {
      throw new Error(
        "D1 migrations not applied. Check poolOptions.workers.miniflare.d1Databases or wrangler migrations.",
      );
    }
  });

  v_23805a("GET /oth-path — public clone 이면 인증 없이 items 반환", async () => {
    const v_1badb6 = await v_bfb240("pub@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "pubclone", "public");
    const v_c09aa8 = await v_fa006d(v_6e0fd3, "hello");

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/oth-path`);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      items: Array<{
        id: number;
        cloneId: number;
        content: string | null;
        mediaUrl: string | null;
        mediaType: string | null;
        likesCount: number;
        visibility: "public" | "followers" | "private";
        createdAt: string;
      }>;
      nextCursor: number | null;
    };
    v_4d37e3(Array.isArray(v_4d33b2.items)).toBe(true);
    const v_ea719c = v_4d33b2.items.find((v_ebec57) => v_ebec57.id === v_c09aa8);
    v_4d37e3(v_ea719c).toBeDefined();
    v_4d37e3(v_ea719c!.cloneId).toBe(v_6e0fd3);
    v_4d37e3(v_ea719c!.content).toBe("hello");
    v_4d37e3(v_ea719c!.visibility).toBe("public");
    v_4d37e3(v_4d33b2).toHaveProperty("nextCursor");
  });

  v_23805a("GET /oth-path — private clone 은 비로그인 시 403", async () => {
    const v_1badb6 = await v_bfb240("priv@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "privclone", "private");
    await v_fa006d(v_6e0fd3, "secret");

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/oth-path`);
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("GET /oth-path — followers clone 은 비로그인 시 403", async () => {
    const v_1badb6 = await v_bfb240("flw@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "flwclone", "followers");
    await v_fa006d(v_6e0fd3, "fans only");

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/oth-path`);
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — 비로그인 시 401", async () => {
    const v_1badb6 = await v_bfb240("pw@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "pwclone", "public");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/oth-path`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "hi" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
