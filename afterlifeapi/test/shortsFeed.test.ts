import { describe, it, expect } from 'vitest';
import { SELF, env } from 'cloudflare:test';

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)")
    .bind(email)
    .run();
  return (await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number, username: string, visibility: 'public' | 'followers' | 'private', cloneType = 'memlow'): Promise<number> {
  await db()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, ?, ?, CURRENT_TIMESTAMP)")
    .bind(ownerId, username, cloneType, visibility)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function seedShort(cloneId: number, status: 'queued' | 'processing' | 'ready' | 'failed', mediaUrl: string | null = null): Promise<number> {
  const ins = await db()
    .prepare("INSERT INTO clone_shorts (clone_id, status, media_url) VALUES (?, ?, ?) RETURNING id")
    .bind(cloneId, status, mediaUrl)
    .first<{ id: number }>();
  return ins!.id;
}

async function seedShareOwner(cloneId: number, ownerId: number, targetUserId: number): Promise<void> {
  await db()
    .prepare("INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')")
    .bind(cloneId, ownerId, targetUserId)
    .run();
}

async function softDeleteClone(cloneId: number): Promise<void> {
  await db()
    .prepare("UPDATE clones SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(cloneId)
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import('../src/lib/jwt');
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');
  return issueToken({ sub: userId, kind: 'access' }, secret, 60 * 10);
}

async function fetchFeed(userId: number): Promise<Response> {
  const token = await issueAccessToken(userId);
  return SELF.fetch('http://localhost/oth-path', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe('GET /oth-path — 피드', () => {
  it('unauthenticated → 401', async () => {
    const res = await SELF.fetch('http://localhost/oth-path');
    expect(res.status).toBe(401);
  });

  it("returns public + owner-private + accepted-share-owner private; excludes strangers' private", async () => {
    const viewer = await seedUser('a7a-viewer@test.local');
    const stranger = await seedUser('a7a-stranger@test.local');

    const pubClone = await seedClone(stranger, 'a7a_pub', 'public', 'friend');
    const myPrivClone = await seedClone(viewer, 'a7a_mine', 'private', 'memlow');
    const coownerClone = await seedClone(stranger, 'a7a_co', 'private', 'memlow');
    await seedShareOwner(coownerClone, stranger, viewer);
    const hiddenClone = await seedClone(stranger, 'a7a_hidden', 'private', 'mentor');

    await seedShort(pubClone, 'ready', 'https://cdn/pub.mp4');
    await seedShort(myPrivClone, 'ready', 'https://cdn/mine.mp4');
    await seedShort(coownerClone, 'ready', 'https://cdn/co.mp4');
    await seedShort(hiddenClone, 'ready', 'https://cdn/hidden.mp4');

    const res = await fetchFeed(viewer);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ cloneId: number }>; nextCursor: string | null };
    const cloneIds = body.items.map((x) => x.cloneId);
    expect(cloneIds).toEqual(expect.arrayContaining([pubClone, myPrivClone, coownerClone]));
    expect(cloneIds).not.toContain(hiddenClone);
    expect(body.nextCursor).toBeNull();
  });

  it('excludes non-ready statuses (queued/processing/failed)', async () => {
    const viewer = await seedUser('a7b-viewer@test.local');
    const pubClone = await seedClone(viewer, 'a7b_pub', 'public');

    await seedShort(pubClone, 'queued');
    await seedShort(pubClone, 'processing');
    await seedShort(pubClone, 'failed', null);
    const readyId = await seedShort(pubClone, 'ready', 'https://cdn/ready.mp4');

    const res = await fetchFeed(viewer);
    const body = (await res.json()) as { items: Array<{ shortId: number }> };
    const ids = body.items.map((x) => x.shortId);
    expect(ids).toEqual([readyId]);
  });

  it('excludes shorts whose clone is soft-deleted', async () => {
    const viewer = await seedUser('a7c-viewer@test.local');
    const goodClone = await seedClone(viewer, 'a7c_good', 'public', 'memlow');
    const deadClone = await seedClone(viewer, 'a7c_dead', 'public', 'friend');
    const goodShort = await seedShort(goodClone, 'ready', 'https://cdn/good.mp4');
    await seedShort(deadClone, 'ready', 'https://cdn/dead.mp4');
    await softDeleteClone(deadClone);

    const res = await fetchFeed(viewer);
    const body = (await res.json()) as { items: Array<{ shortId: number }> };
    expect(body.items.map((x) => x.shortId)).toEqual([goodShort]);
  });

  it('response item shape: shortId, cloneId, mediaUrl, name, cloneType', async () => {
    const viewer = await seedUser('a7d-viewer@test.local');
    const cloneId = await seedClone(viewer, 'a7d_pub', 'public', 'friend');
    const shortId = await seedShort(cloneId, 'ready', 'https://cdn/x.mp4');

    const res = await fetchFeed(viewer);
    const body = (await res.json()) as { items: Array<Record<string, unknown>> };
    const item = body.items.find((x) => x.shortId === shortId);
    expect(item).toBeDefined();
    expect(item).toMatchObject({
      shortId,
      cloneId,
      mediaUrl: 'https://cdn/x.mp4',
      cloneType: 'friend',
    });
    expect(typeof item!.name).toBe('string');
  });
});
