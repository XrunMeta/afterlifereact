import { describe, it, expect } from 'vitest';
import { SELF, env } from 'cloudflare:test';

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)")
    .bind(email)
    .run();
  const u = await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  await db()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)")
    .bind(ownerId, username)
    .run();
  const c = await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import('../src/lib/jwt');
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');
  return issueToken({ sub: userId, kind: 'access' }, secret, 60 * 10);
}

describe('POST /oth-path', () => {
  it('owner enqueues a short and receives status=queued', async () => {
    const ownerId = await seedUser('a4-owner@test.local');
    const cloneId = await seedClone(ownerId, 'a4_owner_c');
    const token = await issueAccessToken(ownerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { shortId: number; status: string };
    expect(typeof body.shortId).toBe('number');
    expect(body.status).toBe('queued');
  });

  it('non-owner receives 403', async () => {
    const ownerId = await seedUser('a4-deny-o@test.local');
    const cloneId = await seedClone(ownerId, 'a4_deny_c');
    const strangerId = await seedUser('a4-deny-s@test.local');
    const token = await issueAccessToken(strangerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it('unauthenticated receives 401', async () => {
    const ownerId = await seedUser('a4-anon-o@test.local');
    const cloneId = await seedClone(ownerId, 'a4_anon_c');
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/shorts/generate`, {
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /oth-path', () => {
  it('returns status + mediaUrl for owner-initiated short', async () => {
    const ownerId = await seedUser('a4-get-o@test.local');
    const cloneId = await seedClone(ownerId, 'a4_get_c');
    const token = await issueAccessToken(ownerId);
    const postRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const { shortId } = (await postRes.json()) as { shortId: number; status: string };
    const getRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/shorts/${shortId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { shortId: number; status: string; mediaUrl: string | null };
    expect(body.shortId).toBe(shortId);
    expect(body.status).toBe('queued');
    expect(body.mediaUrl).toBeNull();
  });
});
