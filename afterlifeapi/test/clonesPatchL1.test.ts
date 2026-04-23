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

async function seedCloneWithEditor(ownerId: number, username: string): Promise<number> {
  await db()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)")
    .bind(ownerId, username, ownerId)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function seedShareOwner(cloneId: number, ownerId: number, targetUserId: number): Promise<void> {
  await db()
    .prepare("INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')")
    .bind(cloneId, ownerId, targetUserId)
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import('../src/lib/jwt');
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');
  return issueToken({ sub: userId, kind: 'access' }, secret, 60 * 10);
}

async function patchClone(cloneId: number, userId: number, body: unknown): Promise<Response> {
  const token = await issueAccessToken(userId);
  return SELF.fetch(`http://localhost/oth-path${cloneId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /oth-path — L1 편집', () => {
  it('primary editor saves l1_profile and persona_attributes sync', async () => {
    const owner = await seedUser('a6a-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a6a_c');

    const res = await patchClone(cloneId, owner, {
      l1_profile: { attrs: { tone: 'warm', hobby: 'music' }, notes: 'loves jazz' },
    });
    expect(res.status).toBe(200);

    const stored = await db()
      .prepare('SELECT l1_profile FROM clones WHERE id = ?')
      .bind(cloneId)
      .first<{ l1_profile: string }>();
    expect(JSON.parse(stored!.l1_profile)).toEqual({
      attrs: { tone: 'warm', hobby: 'music' },
      notes: 'loves jazz',
    });

    const rows = await db()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level = 'l1' ORDER BY key")
      .bind(cloneId)
      .all<{ key: string; value: string }>();
    expect(rows.results).toEqual([
      { key: 'hobby', value: 'music' },
      { key: 'tone', value: 'warm' },
    ]);
  });

  it('persona_attributes is replaced on subsequent L1 patch (DELETE + INSERT)', async () => {
    const owner = await seedUser('a6b-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a6b_c');

    const first = await patchClone(cloneId, owner, {
      l1_profile: { attrs: { tone: 'warm', hobby: 'music' }, notes: '' },
    });
    expect(first.status).toBe(200);

    const second = await patchClone(cloneId, owner, {
      l1_profile: { attrs: { tone: 'sharp' }, notes: 'updated' },
    });
    expect(second.status).toBe(200);

    const rows = await db()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level = 'l1' ORDER BY key")
      .bind(cloneId)
      .all<{ key: string; value: string }>();
    expect(rows.results).toEqual([{ key: 'tone', value: 'sharp' }]);
  });

  it('accepted-share owner (not primary editor) → 403 on L1 edit', async () => {
    const owner = await seedUser('a6c-o@test.local');
    const coowner = await seedUser('a6c-co@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a6c_c');
    await seedShareOwner(cloneId, owner, coowner);

    const res = await patchClone(cloneId, coowner, {
      l1_profile: { attrs: { tone: 'sharp' }, notes: '' },
    });
    expect(res.status).toBe(403);
  });

  it('non-L1 field edit by accepted-share owner still works (existing behavior intact)', async () => {
    const owner = await seedUser('a6d-o@test.local');
    const coowner = await seedUser('a6d-co@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a6d_c');
    await seedShareOwner(cloneId, owner, coowner);

    const res = await patchClone(cloneId, coowner, { name: 'Renamed' });
    expect(res.status).toBe(200);
  });

  it('l2_profile in body → 422 VALIDATION_FAILED (strict schema)', async () => {
    const owner = await seedUser('a6e-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a6e_c');

    const res = await patchClone(cloneId, owner, {
      l2_profile: { anything: 'nope' },
    });
    expect(res.status).toBe(422);
  });
});
