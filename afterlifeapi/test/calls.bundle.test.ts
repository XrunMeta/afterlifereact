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

  v_23805a("voice_clone done 잡 있는 클론은 assets.voiceRawUrl = api files URL (voice_se_url↔out_url 조인)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-vraw@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_vraw_clone");
    await v_a1651b
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/vraw/voice.m4a', 'audio/mp4', 12345, ?, 'voice_src')`,
      )
      .bind(v_1badb6)
      .run();
    const v_8b5cd8 = await v_a1651b
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/vraw/voice.m4a'")
      .first<{ id: number }>();
    const v_7ce8a7 = "https://oth-path.example/oth-path";
    await v_a1651b.prepare("UPDATE clones SET voice_se_url = ? WHERE id = ?").bind(v_7ce8a7, v_6e0fd3).run();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-vraw-1', ?, 'voice_clone', ?, 'done', ?)`,
      )
      .bind(v_1badb6, v_8b5cd8!.id, v_7ce8a7)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { voiceRawUrl: string | null } };
    v_4d37e3(v_7adc95.voiceRawUrl).toBe(`http://localhost/oth-path${v_8b5cd8!.id}`);
  });

  v_23805a("voice_clone 잡 없는 클론은 voiceRawUrl null", async () => {
    const v_1badb6 = await v_bfb240("bundle-novraw@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_novraw_clone");
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { voiceRawUrl: string | null } };
    v_4d37e3(v_7adc95.voiceRawUrl).toBeNull();
  });

  v_23805a("faceUrl: idle_video done 잡 있는 클론은 assets.faceUrl = api files URL", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-face@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_face_clone");
    await v_a1651b
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/face/photo.jpg', 'image/jpeg', 55000, ?, 'clone_src')`,
      )
      .bind(v_1badb6)
      .run();
    const v_8b5cd8 = await v_a1651b
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/face/photo.jpg'")
      .first<{ id: number }>();
    const v_a49e17 = "https://r2.example.com/idle/face_idle.mp4";
    await v_a1651b.prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?").bind(v_a49e17, v_6e0fd3).run();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-face-1', ?, 'idle_video', ?, 'done', ?)`,
      )
      .bind(v_1badb6, v_8b5cd8!.id, v_a49e17)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { faceUrl: string | null } };
    v_4d37e3(v_7adc95.faceUrl).toBe(`http://localhost/oth-path${v_8b5cd8!.id}`);
  });

  v_23805a("faceUrl: idle_video_url 있으나 done 잡 없으면 assets.faceUrl === null", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-face-nojob@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_face_nojob_clone");
    await v_a1651b
      .prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?")
      .bind("https://r2.example.com/idle/nojob.mp4", v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { faceUrl: string | null } };
    v_4d37e3(v_7adc95.faceUrl).toBeNull();
  });

  v_23805a("faceUrl: idle_video_url 자체가 null이면 assets.faceUrl === null", async () => {
    const v_1badb6 = await v_bfb240("bundle-face-nourl@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_face_nourl_clone");
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { faceUrl: string | null } };
    v_4d37e3(v_7adc95.faceUrl).toBeNull();
  });

  v_23805a("fillerVideoUrls: filler_video_urls NULL → []", async () => {
    const v_1badb6 = await v_bfb240("bundle-filler-null@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_filler_null_clone");
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { fillerVideoUrls: string[] } };
    v_4d37e3(Array.isArray(v_7adc95.fillerVideoUrls)).toBe(true);
    v_4d37e3(v_7adc95.fillerVideoUrls).toHaveLength(0);
  });

  v_23805a("fillerVideoUrls: 정상 JSON 3개 → length 3", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-filler-3@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_filler_3_clone");
    const v_942aa2 = [
      "https://r2.example.com/filler/0.mp4",
      "https://r2.example.com/filler/1.mp4",
      "https://r2.example.com/filler/2.mp4",
    ];
    await v_a1651b
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind(JSON.stringify(v_942aa2), v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { fillerVideoUrls: string[] } };
    v_4d37e3(v_7adc95.fillerVideoUrls).toEqual(v_942aa2);
  });

  v_23805a("fillerVideoUrls: 깨진 JSON → []", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-filler-bad@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_filler_bad_clone");
    await v_a1651b
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind("{NOT_VALID_JSON[[[", v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { fillerVideoUrls: string[] } };
    v_4d37e3(Array.isArray(v_7adc95.fillerVideoUrls)).toBe(true);
    v_4d37e3(v_7adc95.fillerVideoUrls).toHaveLength(0);
  });

  v_23805a("fillerVideoUrls: 비배열 JSON(객체) → []", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-filler-obj@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_filler_obj_clone");
    await v_a1651b
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind('{"key":"val"}', v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { fillerVideoUrls: string[] } };
    v_4d37e3(Array.isArray(v_7adc95.fillerVideoUrls)).toBe(true);
    v_4d37e3(v_7adc95.fillerVideoUrls).toHaveLength(0);
  });

  v_23805a("fillerVideoUrls: 비문자열 원소 혼재 → 문자열만 필터 (el CONCERN)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-filler-mixed@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_filler_mixed_clone");
    await v_a1651b
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind('[1, null, "https://r2.example.com/filler/0.mp4"]', v_6e0fd3)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { fillerVideoUrls: string[] } };
    v_4d37e3(v_7adc95.fillerVideoUrls).toHaveLength(1);
    v_4d37e3(v_7adc95.fillerVideoUrls[0]).toBe("https://r2.example.com/filler/0.mp4");
  });

  v_23805a("voice_clone done 잡 여러 개면 최신(created_at) done 잡 선택 + failed 무시 (out_url 조인)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-vraw-multi@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_vraw_multi_clone");

    async function v_c808bd(v_b24339): Promise<number> {
      await v_a1651b
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
           VALUES (?, 'audio/mp4', 100, ?, 'voice_src')`,
        )
        .bind(v_b24339, v_1badb6)
        .run();
      const v_cb35cb = await v_a1651b.prepare("SELECT id FROM files WHERE r2_key = ?").bind(v_b24339).first<{ id: number }>();
      return v_cb35cb!.id;
    }
    const v_97e17f = await v_c808bd("uploadedfiles/multi/old.m4a");
    const v_bd1130 = await v_c808bd("uploadedfiles/multi/fail.m4a");
    const v_1726aa = await v_c808bd("uploadedfiles/multi/new.m4a");

    const v_7ce8a7 = "https://oth-path.example/oth-path";
    await v_a1651b.prepare("UPDATE clones SET voice_se_url = ? WHERE id = ?").bind(v_7ce8a7, v_6e0fd3).run();

    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-old', ?, 'voice_clone', ?, 'done', ?, '2026-01-01 00:00:00')`,
      )
      .bind(v_1badb6, v_97e17f, v_7ce8a7)
      .run();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-fail', ?, 'voice_clone', ?, 'failed', ?, '2026-03-01 00:00:00')`,
      )
      .bind(v_1badb6, v_bd1130, v_7ce8a7)
      .run();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-new', ?, 'voice_clone', ?, 'done', ?, '2026-02-01 00:00:00')`,
      )
      .bind(v_1badb6, v_1726aa, v_7ce8a7)
      .run();
    const v_21cc31 = await v_86c39f(v_1badb6);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const { assets: v_7adc95 } = (await v_8f00b9.json()) as { assets: { voiceRawUrl: string | null } };

    v_4d37e3(v_7adc95.voiceRawUrl).toBe(`http://localhost/oth-path${v_1726aa}`);
  });

  v_23805a("학습 relation 이 clone.relation 보다 우선(E)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("bundle-relation-e@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "bundle_relation_e_clone");
    await v_a1651b.prepare("UPDATE clones SET relation = ? WHERE id = ?").bind("지인", v_6e0fd3).run();

    await v_a1651b
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(v_6e0fd3, v_1badb6, JSON.stringify({ relation: "손녀" }))
      .run();
    await v_c9c489.KV_ONT.delete(`l2:${v_6e0fd3}:${v_1badb6}`);

    const v_21cc31 = await v_86c39f(v_1badb6);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/bundle`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { personaBundle: { persona: { relation: string } } };
    v_4d37e3(v_4d33b2.personaBundle.persona.relation).toBe("손녀");
  });
});
