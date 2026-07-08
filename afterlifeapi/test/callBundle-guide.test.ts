import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

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
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("GET /oth-path — guideVideoUrls", () => {
  v_23805a("guide_video_urls JSON 2개 → assets.guideVideoUrls 길이 2", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-guide-2@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_guide_2_clone");
    const v_942aa2 = ["https://x/oth-path", "https://x/oth-path"];
    await v_a1651b
      .prepare("UPDATE clones SET guide_video_urls = ? WHERE id = ?")
      .bind(JSON.stringify(v_942aa2), v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { guideVideoUrls: string[] } };
    v_4d37e3(v_7adc95.guideVideoUrls).toEqual(v_942aa2);
  });

  v_23805a("guide_video_urls NULL이면 []", async () => {
    const v_1badb6 = await v_bfb240("bundle-guide-null@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_guide_null_clone");
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { guideVideoUrls: string[] } };
    v_4d37e3(Array.isArray(v_7adc95.guideVideoUrls)).toBe(true);
    v_4d37e3(v_7adc95.guideVideoUrls).toHaveLength(0);
  });
});
