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

v_469bf2("GET /oth-path", () => {
  v_23805a("returns personaBundle+assets without creating a call_sessions row", async () => {
    const v_43e90c = await v_bfb240("bundle-ok@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "bundle_clone_ok");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      personaBundle: unknown;
      assets: { voiceSeKey: string | null; voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null };
    };
    v_4d37e3(v_4d33b2.personaBundle).toBeTruthy();
    v_4d37e3(v_4d33b2.assets).toHaveProperty("voiceSeKey");

    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT COUNT(*) as n FROM call_sessions WHERE clone_id = ?"
    ).bind(v_6e0fd3).first<{ n: number }>();
    v_4d37e3(v_3ac7e7!.n).toBe(0);
  });

  v_23805a("requires auth — 비로그인 401", async () => {
    const v_1badb6 = await v_bfb240("bundle-anon@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_clone_anon");

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`);
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("없는 clone → 404", async () => {
    const v_43e90c = await v_bfb240("bundle-404@test.local");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("private 클론은 stranger에게 403", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-priv-owner@test.local");
    await v_a1651b
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Priv', 'bundle_priv_clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(v_1badb6)
      .run();
    const v_eb25ce = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'bundle_priv_clone'").first<{ id: number }>();
    const v_1c6644 = await v_bfb240("bundle-priv-stranger@test.local");
    const v_21cc31 = await v_86c39f(v_1c6644);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_eb25ce!.id}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("personaBundle에 l0.rules_text와 persona.displayName 포함", async () => {
    const v_43e90c = await v_bfb240("bundle-pb@test.local");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "bundle_pb_clone");
    const v_21cc31 = await v_86c39f(v_43e90c);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      personaBundle: { l0: { rules_text: string }; persona: { displayName: string } };
      assets: unknown;
    };
    v_4d37e3(typeof v_4d33b2.personaBundle.l0.rules_text).toBe("string");
    v_4d37e3(v_4d33b2.personaBundle.persona.displayName).toBe("CT"); 
  });

  v_23805a("voice_se_url 있는 클론은 assets.voiceSeUrl 반환", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-seurl@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_se_url_clone");
    await v_a1651b
      .prepare("UPDATE clones SET voice_se_url = ?, idle_video_url = ?, avatar_url = ? WHERE id = ?")
      .bind("https://r2.example.com/voice/se.pth", "https://r2.example.com/idle.mp4", "https://r2.example.com/avatar.jpg", v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as {
      assets: { voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null; voiceSeKey: string | null };
    };
    v_4d37e3(v_7adc95.voiceSeUrl).toBe("https://r2.example.com/voice/se.pth");
    v_4d37e3(v_7adc95.idleVideoUrl).toBe("https://r2.example.com/idle.mp4");
    v_4d37e3(v_7adc95.avatarUrl).toBe("https://r2.example.com/avatar.jpg");
    v_4d37e3(v_7adc95.voiceSeKey).toBeNull();
  });
});
