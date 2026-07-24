import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("GET /oth-path", () => {
  it("returns personaBundle+assets without creating a call_sessions row", async () => {
    const userId = await seedUser("bundle-ok@test.local");
    const cloneId = await seedClone(userId, "bundle_clone_ok");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      personaBundle: unknown;
      assets: { voiceSeKey: string | null; voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null };
    };
    expect(body.personaBundle).toBeTruthy();
    expect(body.assets).toHaveProperty("voiceSeKey");

    const row = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM call_sessions WHERE clone_id = ?"
    ).bind(cloneId).first<{ n: number }>();
    expect(row!.n).toBe(0);
  });

  it("requires auth — 비로그인 401", async () => {
    const ownerId = await seedUser("bundle-anon@test.local");
    const cloneId = await seedClone(ownerId, "bundle_clone_anon");

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`);
    expect(res.status).toBe(401);
  });

  it("없는 clone → 404", async () => {
    const userId = await seedUser("bundle-404@test.local");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  it("private 클론은 stranger에게 403", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-priv-owner@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Priv', 'bundle_priv_clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(ownerId)
      .run();
    const clone = await db.prepare("SELECT id FROM clones WHERE username = 'bundle_priv_clone'").first<{ id: number }>();
    const stranger = await seedUser("bundle-priv-stranger@test.local");
    const token = await issueAccessToken(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${clone!.id}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("personaBundle에 l0.rules_text와 persona.displayName 포함", async () => {
    const userId = await seedUser("bundle-pb@test.local");
    const cloneId = await seedClone(userId, "bundle_pb_clone");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      personaBundle: { l0: { rules_text: string }; persona: { displayName: string } };
      assets: unknown;
    };
    expect(typeof body.personaBundle.l0.rules_text).toBe("string");
    expect(body.personaBundle.persona.displayName).toBe("CT"); 
  });

  it("voice_se_url 있는 클론은 assets.voiceSeUrl 반환", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-seurl@test.local");
    const cloneId = await seedClone(ownerId, "bundle_se_url_clone");
    await db
      .prepare("UPDATE clones SET voice_se_url = ?, idle_video_url = ?, avatar_url = ? WHERE id = ?")
      .bind("https://r2.example.com/voice/se.pth", "https://r2.example.com/idle.mp4", "https://r2.example.com/avatar.jpg", cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as {
      assets: { voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null; voiceSeKey: string | null };
    };
    expect(assets.voiceSeUrl).toBe("https://r2.example.com/voice/se.pth");
    expect(assets.idleVideoUrl).toBe("https://r2.example.com/idle.mp4");
    expect(assets.avatarUrl).toBe("https://r2.example.com/avatar.jpg");
    expect(assets.voiceSeKey).toBeNull();
  });

  it("voice_clone done 잡 있는 클론은 assets.voiceRawUrl = api files URL (voice_se_url↔out_url 조인)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-vraw@test.local");
    const cloneId = await seedClone(ownerId, "bundle_vraw_clone");
    await db
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/vraw/voice.m4a', 'audio/mp4', 12345, ?, 'voice_src')`,
      )
      .bind(ownerId)
      .run();
    const f = await db
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/vraw/voice.m4a'")
      .first<{ id: number }>();
    const outUrl = "https://oth-path.example/oth-path";
    await db.prepare("UPDATE clones SET voice_se_url = ? WHERE id = ?").bind(outUrl, cloneId).run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-vraw-1', ?, 'voice_clone', ?, 'done', ?)`,
      )
      .bind(ownerId, f!.id, outUrl)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { voiceRawUrl: string | null } };
    expect(assets.voiceRawUrl).toBe(`http://localhost/oth-path${f!.id}`);
  });

  it("voice_clone 잡 없는 클론은 voiceRawUrl null", async () => {
    const ownerId = await seedUser("bundle-novraw@test.local");
    const cloneId = await seedClone(ownerId, "bundle_novraw_clone");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { voiceRawUrl: string | null } };
    expect(assets.voiceRawUrl).toBeNull();
  });

  it("faceUrl: idle_video done 잡 있는 클론은 assets.faceUrl = api files URL", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-face@test.local");
    const cloneId = await seedClone(ownerId, "bundle_face_clone");
    await db
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/face/photo.jpg', 'image/jpeg', 55000, ?, 'clone_src')`,
      )
      .bind(ownerId)
      .run();
    const f = await db
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/face/photo.jpg'")
      .first<{ id: number }>();
    const idleOutUrl = "https://r2.example.com/idle/face_idle.mp4";
    await db.prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?").bind(idleOutUrl, cloneId).run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-face-1', ?, 'idle_video', ?, 'done', ?)`,
      )
      .bind(ownerId, f!.id, idleOutUrl)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { faceUrl: string | null } };
    expect(assets.faceUrl).toBe(`http://localhost/oth-path${f!.id}`);
  });

  it("faceUrl: idle_video_url 있으나 done 잡 없으면 assets.faceUrl === null", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-face-nojob@test.local");
    const cloneId = await seedClone(ownerId, "bundle_face_nojob_clone");
    await db
      .prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?")
      .bind("https://r2.example.com/idle/nojob.mp4", cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { faceUrl: string | null } };
    expect(assets.faceUrl).toBeNull();
  });

  it("faceUrl: idle_video_url 자체가 null이면 assets.faceUrl === null", async () => {
    const ownerId = await seedUser("bundle-face-nourl@test.local");
    const cloneId = await seedClone(ownerId, "bundle_face_nourl_clone");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { faceUrl: string | null } };
    expect(assets.faceUrl).toBeNull();
  });

  it("faceUrl: clone.idle_video_url(prod 도메인)과 job.out_url(preview 도메인)이 달라도 /oth-path 경로로 매칭 (T-159 회귀)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-face-domain@test.local");
    const cloneId = await seedClone(ownerId, "bundle_face_domain_clone");

    await db
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/face/domain.jpg', 'image/jpeg', 55000, ?, 'clone_src')`,
      )
      .bind(ownerId)
      .run();
    const f = await db
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/face/domain.jpg'")
      .first<{ id: number }>();

    const idleId = 999321;
    const cloneIdleUrl = `https://edge-alt.example.invalid/oth-path${idleId}`;
    const jobOutUrl = `https://edge-alt-preview.example.invalid/oth-path${idleId}`;
    await db
      .prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?")
      .bind(cloneIdleUrl, cloneId)
      .run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-face-domain', ?, 'idle_video', ?, 'done', ?)`,
      )
      .bind(ownerId, f!.id, jobOutUrl)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { faceUrl: string | null } };

    expect(assets.faceUrl).toBe(`http://localhost/oth-path${f!.id}`);
  });

  it("faceUrl: /oth-path 와 /oth-path 는 경계 오탐 없이 비매칭 (T-159 경계)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-face-boundary@test.local");
    const cloneId = await seedClone(ownerId, "bundle_face_boundary_clone");
    await db
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
         VALUES ('uploadedfiles/face/boundary.jpg', 'image/jpeg', 55000, ?, 'clone_src')`,
      )
      .bind(ownerId)
      .run();
    const f = await db
      .prepare("SELECT id FROM files WHERE r2_key = 'uploadedfiles/face/boundary.jpg'")
      .first<{ id: number }>();

    await db
      .prepare("UPDATE clones SET idle_video_url = ? WHERE id = ?")
      .bind("https://edge-alt.example.invalid/oth-path", cloneId)
      .run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url)
         VALUES ('job-face-boundary', ?, 'idle_video', ?, 'done', ?)`,
      )
      .bind(ownerId, f!.id, "https://edge-alt-preview.example.invalid/oth-path")
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { faceUrl: string | null } };
    expect(assets.faceUrl).toBeNull();
  });

  it("fillerVideoUrls: filler_video_urls NULL → []", async () => {
    const ownerId = await seedUser("bundle-filler-null@test.local");
    const cloneId = await seedClone(ownerId, "bundle_filler_null_clone");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { fillerVideoUrls: string[] } };
    expect(Array.isArray(assets.fillerVideoUrls)).toBe(true);
    expect(assets.fillerVideoUrls).toHaveLength(0);
  });

  it("fillerVideoUrls: 정상 JSON 3개 → length 3", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-filler-3@test.local");
    const cloneId = await seedClone(ownerId, "bundle_filler_3_clone");
    const urls = [
      "https://r2.example.com/filler/0.mp4",
      "https://r2.example.com/filler/1.mp4",
      "https://r2.example.com/filler/2.mp4",
    ];
    await db
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind(JSON.stringify(urls), cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { fillerVideoUrls: string[] } };
    expect(assets.fillerVideoUrls).toEqual(urls);
  });

  it("fillerVideoUrls: 깨진 JSON → []", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-filler-bad@test.local");
    const cloneId = await seedClone(ownerId, "bundle_filler_bad_clone");
    await db
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind("{NOT_VALID_JSON[[[", cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { fillerVideoUrls: string[] } };
    expect(Array.isArray(assets.fillerVideoUrls)).toBe(true);
    expect(assets.fillerVideoUrls).toHaveLength(0);
  });

  it("fillerVideoUrls: 비배열 JSON(객체) → []", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-filler-obj@test.local");
    const cloneId = await seedClone(ownerId, "bundle_filler_obj_clone");
    await db
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind('{"key":"val"}', cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { fillerVideoUrls: string[] } };
    expect(Array.isArray(assets.fillerVideoUrls)).toBe(true);
    expect(assets.fillerVideoUrls).toHaveLength(0);
  });

  it("fillerVideoUrls: 비문자열 원소 혼재 → 문자열만 필터 (el CONCERN)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-filler-mixed@test.local");
    const cloneId = await seedClone(ownerId, "bundle_filler_mixed_clone");
    await db
      .prepare("UPDATE clones SET filler_video_urls = ? WHERE id = ?")
      .bind('[1, null, "https://r2.example.com/filler/0.mp4"]', cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { fillerVideoUrls: string[] } };
    expect(assets.fillerVideoUrls).toHaveLength(1);
    expect(assets.fillerVideoUrls[0]).toBe("https://r2.example.com/filler/0.mp4");
  });

  it("voice_clone done 잡 여러 개면 최신(created_at) done 잡 선택 + failed 무시 (out_url 조인)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-vraw-multi@test.local");
    const cloneId = await seedClone(ownerId, "bundle_vraw_multi_clone");

    async function seedFile(key: string): Promise<number> {
      await db
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
           VALUES (?, 'audio/mp4', 100, ?, 'voice_src')`,
        )
        .bind(key, ownerId)
        .run();
      const r = await db.prepare("SELECT id FROM files WHERE r2_key = ?").bind(key).first<{ id: number }>();
      return r!.id;
    }
    const fOld = await seedFile("uploadedfiles/multi/old.m4a");
    const fFail = await seedFile("uploadedfiles/multi/fail.m4a");
    const fNew = await seedFile("uploadedfiles/multi/new.m4a");

    const outUrl = "https://oth-path.example/oth-path";
    await db.prepare("UPDATE clones SET voice_se_url = ? WHERE id = ?").bind(outUrl, cloneId).run();

    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-old', ?, 'voice_clone', ?, 'done', ?, '2026-01-01 00:00:00')`,
      )
      .bind(ownerId, fOld, outUrl)
      .run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-fail', ?, 'voice_clone', ?, 'failed', ?, '2026-03-01 00:00:00')`,
      )
      .bind(ownerId, fFail, outUrl)
      .run();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, out_url, created_at)
         VALUES ('job-new', ?, 'voice_clone', ?, 'done', ?, '2026-02-01 00:00:00')`,
      )
      .bind(ownerId, fNew, outUrl)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { voiceRawUrl: string | null } };

    expect(assets.voiceRawUrl).toBe(`http://localhost/oth-path${fNew}`);
  });

  it("학습 relation 이 clone.relation 보다 우선(E)", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-relation-e@test.local");
    const cloneId = await seedClone(ownerId, "bundle_relation_e_clone");
    await db.prepare("UPDATE clones SET relation = ? WHERE id = ?").bind("지인", cloneId).run();

    await db
      .prepare(
        "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
      )
      .bind(cloneId, ownerId, JSON.stringify({ relation: "손녀" }))
      .run();
    await env.KV_ONT.delete(`l2:${cloneId}:${ownerId}`);

    const token = await issueAccessToken(ownerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { personaBundle: { persona: { relation: string } } };
    expect(body.personaBundle.persona.relation).toBe("손녀");
  });
});
