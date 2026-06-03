import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

interface ClonesRow { cnt: number }

async function hasClonesTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  const u = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  return u!.id;
}

async function seedClone(
  ownerId: number,
  username: string,
  visibility: "public" | "followers" | "private",
): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, visibility)
    .run();
  const c = await db
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();
  return c!.id;
}

async function seedShare(
  cloneId: number,
  ownerId: number,
  targetUserId: number,
  role: "owner" | "viewer",
): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status)
       VALUES (?, ?, ?, ?, 'accepted')`,
    )
    .bind(cloneId, ownerId, targetUserId, role)
    .run();
}

async function seedFollow(cloneId: number, userId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(userId, cloneId)
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

describe("clones route — viewerRole 4값", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error(
        "D1 migrations not applied. Check poolOptions.workers.miniflare.d1Databases or wrangler migrations.",
      );
    }
  });

  it("viewerRole = 'owner' for clone owner", async () => {
    const ownerId = await seedUser("vr-owner@test.local");
    const cloneId = await seedClone(ownerId, "vr_owner", "public");
    const token = await issueAccessToken(ownerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clone: { viewerRole: string | null } };
    expect(body.clone.viewerRole).toBe("owner");
  });

  it("viewerRole = 'coowner' for accepted share role='owner' (non-self)", async () => {
    const ownerId = await seedUser("vr-cowo@test.local");
    const coownerId = await seedUser("vr-cowo-target@test.local");
    const cloneId = await seedClone(ownerId, "vr_cowo", "public");
    await seedShare(cloneId, ownerId, coownerId, "owner");
    const token = await issueAccessToken(coownerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clone: { viewerRole: string | null } };
    expect(body.clone.viewerRole).toBe("coowner");
  });

  it("viewerRole = 'coowner' for accepted share role='viewer' (share 접근 유지)", async () => {
    const ownerId = await seedUser("vr-viewer-o@test.local");
    const viewerId = await seedUser("vr-viewer-t@test.local");
    const cloneId = await seedClone(ownerId, "vr_viewer", "public");
    await seedShare(cloneId, ownerId, viewerId, "viewer");
    const token = await issueAccessToken(viewerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clone: { viewerRole: string | null } };
    expect(body.clone.viewerRole).toBe("coowner");
  });

  it("viewerRole = 'follower' for follower (공개 클론)", async () => {
    const ownerId = await seedUser("vr-flw-o@test.local");
    const followerId = await seedUser("vr-flw-t@test.local");
    const cloneId = await seedClone(ownerId, "vr_flw", "public");
    await seedFollow(cloneId, followerId);
    const token = await issueAccessToken(followerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clone: { viewerRole: string | null } };
    expect(body.clone.viewerRole).toBe("follower");
  });

  it("viewerRole = null for anonymous on public clone", async () => {
    const ownerId = await seedUser("vr-anon-o@test.local");
    const cloneId = await seedClone(ownerId, "vr_anon", "public");
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clone: { viewerRole: string | null } };
    expect(body.clone.viewerRole).toBeNull();
  });
});

describe("clones search route — stats 객체 통일", () => {
  it("GET /oth-path — item.stats = {followers, messages, gifts}", async () => {
    const ownerId = await seedUser("search-o@test.local");
    const cloneId = await seedClone(ownerId, "search_clone", "public");

    const res = await SELF.fetch(
      `http://localhost/oth-path?q=search_clone`,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: number;
        name: string;
        username: string;
        cloneType: string;
        avatarUrl: string | null;
        stats: { followers: number; messages: number; gifts: number };
        createdAt: string;
      }>;
      nextCursor: string | null;
    };
    const item = body.items.find((i) => i.id === cloneId);
    expect(item).toBeDefined();
    expect(item!.stats).toEqual({ followers: 0, messages: 0, gifts: 0 });

    expect((item as unknown as { followersCount?: number }).followersCount).toBeUndefined();
  });
});

describe("PATCH /oth-path — voice_preset_id 활성 검증 (L-1)", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("비활성(is_active=0) voice_preset_id로 PATCH → 422 VALIDATION_FAILED", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("patch-voice-l1@test.local");
    const cloneId = await seedClone(ownerId, "patch_voice_l1", "public");
    const token = await issueAccessToken(ownerId);

    await db
      .prepare(
        `INSERT INTO voice_presets (name, sort_order, is_active)
         VALUES ('비활성음색', 99, 0)`,
      )
      .run();
    const vp = await db
      .prepare("SELECT id FROM voice_presets WHERE name = '비활성음색' AND is_active = 0 LIMIT 1")
      .first<{ id: number }>();
    const inactiveId = vp!.id;

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voice_preset_id: inactiveId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("존재하지 않는 voice_preset_id로 PATCH → 422 VALIDATION_FAILED", async () => {
    const ownerId = await seedUser("patch-voice-l1-notfound@test.local");
    const cloneId = await seedClone(ownerId, "patch_voice_l1_nf", "public");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voice_preset_id: 9999999 }),
    });
    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("null로 PATCH (음성 제거) → 200 허용", async () => {
    const ownerId = await seedUser("patch-voice-l1-null@test.local");
    const cloneId = await seedClone(ownerId, "patch_voice_l1_null", "public");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voice_preset_id: null }),
    });
    expect(res.status).toBe(200);
  });
});
