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

async function seedCloneL2(cloneId: number, l2: Record<string, unknown>): Promise<void> {
  await db()
    .prepare("UPDATE clones SET l2_profile = ? WHERE id = ?")
    .bind(JSON.stringify(l2), cloneId)
    .run();
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

async function patchCloneL2(cloneId: number, userId: number, body: unknown): Promise<Response> {
  const token = await issueAccessToken(userId);
  return SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /oth-path — L2 대화 기억 병합 갱신', () => {
  it('owner가 4필드 부분 갱신 → 200, 미지정 필드 보존, 지정 필드 갱신', async () => {
    const owner = await seedUser('b1a-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'b1a_c');

    await seedCloneL2(cloneId, {
      memory_summary: 'old summary',
      relationship: 'old rel',
      context: 'old ctx',
      recent_topics: 'old topics',
    });

    const res = await patchCloneL2(cloneId, owner, {
      memory_summary: 'new summary',
      context: 'new ctx',
    });
    expect(res.status).toBe(200);

    const stored = await db()
      .prepare('SELECT l2_profile FROM clones WHERE id = ?')
      .bind(cloneId)
      .first<{ l2_profile: string }>();
    const parsed = JSON.parse(stored!.l2_profile);

    expect(parsed.memory_summary).toBe('new summary');
    expect(parsed.context).toBe('new ctx');

    expect(parsed.relationship).toBe('old rel');
    expect(parsed.recent_topics).toBe('old topics');
  });

  it('l2_profile 없는 클론에 신규 필드 작성 → 200, 지정 필드만 저장', async () => {
    const owner = await seedUser('b1b-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'b1b_c');

    const res = await patchCloneL2(cloneId, owner, {
      memory_summary: 'brand new',
    });
    expect(res.status).toBe(200);

    const stored = await db()
      .prepare('SELECT l2_profile FROM clones WHERE id = ?')
      .bind(cloneId)
      .first<{ l2_profile: string }>();
    const parsed = JSON.parse(stored!.l2_profile);
    expect(parsed.memory_summary).toBe('brand new');
  });

  it('비-owner(일반 유저) → 403', async () => {
    const owner = await seedUser('b1c-o@test.local');
    const other = await seedUser('b1c-other@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'b1c_c');

    const res = await patchCloneL2(cloneId, other, {
      memory_summary: 'hack',
    });
    expect(res.status).toBe(403);
  });

  it('알 수 없는 필드 → 422 (strict)', async () => {
    const owner = await seedUser('b1d-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'b1d_c');

    const res = await patchCloneL2(cloneId, owner, {
      memory_summary: 'ok',
      unknown_field: 'nope',
    });
    expect(res.status).toBe(422);
  });

  it('빈 객체 → 422 (at least one field)', async () => {
    const owner = await seedUser('b1e-o@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'b1e_c');

    const res = await patchCloneL2(cloneId, owner, {});
    expect(res.status).toBe(422);
  });
});
