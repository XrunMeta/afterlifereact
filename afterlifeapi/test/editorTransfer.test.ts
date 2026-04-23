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

async function createTransfer(cloneId: number, fromUserId: number, toUserId: number): Promise<Response> {
  const token = await issueAccessToken(fromUserId);
  return SELF.fetch(`http://localhost/oth-path${cloneId}/editor-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId }),
  });
}

describe('POST /oth-path', () => {
  it('primary editor creates pending transfer to an accepted-share coowner', async () => {
    const owner = await seedUser('a5a-o@test.local');
    const target = await seedUser('a5a-t@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5a_c');
    await seedShareOwner(cloneId, owner, target);
    const res = await createTransfer(cloneId, owner, target);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; status: string; toUserId: number };
    expect(typeof body.id).toBe('number');
    expect(body.status).toBe('pending');
    expect(body.toUserId).toBe(target);
  });

  it('second pending while one exists → 409 CONFLICT', async () => {
    const owner = await seedUser('a5b-o@test.local');
    const target = await seedUser('a5b-t@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5b_c');
    await seedShareOwner(cloneId, owner, target);
    const first = await createTransfer(cloneId, owner, target);
    expect(first.status).toBe(201);
    const second = await createTransfer(cloneId, owner, target);
    expect(second.status).toBe(409);
  });

  it('non-primary-editor → 403', async () => {
    const owner = await seedUser('a5c-o@test.local');
    const other = await seedUser('a5c-x@test.local');
    const target = await seedUser('a5c-t@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5c_c');
    await seedShareOwner(cloneId, owner, target);
    const res = await createTransfer(cloneId, other, target);
    expect(res.status).toBe(403);
  });

  it('recipient not an accepted-share owner → 422 VALIDATION_FAILED', async () => {
    const owner = await seedUser('a5d-o@test.local');
    const stranger = await seedUser('a5d-s@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5d_c');
    const res = await createTransfer(cloneId, owner, stranger);
    expect(res.status).toBe(422);
  });
});

describe('POST /oth-path', () => {
  it('recipient accepts → primary_editor_user_id becomes recipient', async () => {
    const owner = await seedUser('a5e-o@test.local');
    const target = await seedUser('a5e-t@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5e_c');
    await seedShareOwner(cloneId, owner, target);
    const createRes = await createTransfer(cloneId, owner, target);
    const { id } = (await createRes.json()) as { id: number };

    const targetToken = await issueAccessToken(target);
    const respRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/editor-transfer/${id}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${targetToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    expect(respRes.status).toBe(200);
    const row = await db()
      .prepare('SELECT primary_editor_user_id FROM clones WHERE id = ?')
      .bind(cloneId)
      .first<{ primary_editor_user_id: number }>();
    expect(row?.primary_editor_user_id).toBe(target);
  });

  it('non-recipient cannot respond → 403', async () => {
    const owner = await seedUser('a5f-o@test.local');
    const target = await seedUser('a5f-t@test.local');
    const other = await seedUser('a5f-x@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5f_c');
    await seedShareOwner(cloneId, owner, target);
    const createRes = await createTransfer(cloneId, owner, target);
    const { id } = (await createRes.json()) as { id: number };

    const otherToken = await issueAccessToken(other);
    const respRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/editor-transfer/${id}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    expect(respRes.status).toBe(403);
  });

  it('responding to already-resolved transfer → 409 CONFLICT', async () => {
    const owner = await seedUser('a5g-o@test.local');
    const target = await seedUser('a5g-t@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'a5g_c');
    await seedShareOwner(cloneId, owner, target);
    const createRes = await createTransfer(cloneId, owner, target);
    const { id } = (await createRes.json()) as { id: number };
    const targetToken = await issueAccessToken(target);

    const first = await SELF.fetch(`http://localhost/oth-path${cloneId}/editor-transfer/${id}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${targetToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'decline' }),
    });
    expect(first.status).toBe(200);

    const second = await SELF.fetch(`http://localhost/oth-path${cloneId}/editor-transfer/${id}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${targetToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    expect(second.status).toBe(409);
  });
});
