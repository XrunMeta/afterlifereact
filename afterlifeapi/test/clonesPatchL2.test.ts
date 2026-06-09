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

async function seedPrivateClone(ownerId: number, username: string): Promise<number> {
  await db()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'CT', ?, 'memlow', 'private', ?, CURRENT_TIMESTAMP)")
    .bind(ownerId, username, ownerId)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function seedUserL2(cloneId: number, userId: number, data: object): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO clone_ont (clone_id,user_id,data,updated_at) VALUES (?,?,?,unixepoch()) " +
      "ON CONFLICT(clone_id,user_id) DO UPDATE SET data=excluded.data"
    )
    .bind(cloneId, userId, JSON.stringify(data))
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import('../src/lib/jwt');
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');
  return issueToken({ sub: userId, kind: 'access' }, secret, 60 * 10);
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

describe('PATCH /oth-path — clone_ont 사용자별 L2 갱신', () => {
  it('자기 L2 저장 + 두 사용자 격리 + 채팅 필드 보존', async () => {
    const ownerA = await seedUser('l2-a@test.local');
    const ownerB = await seedUser('l2-b@test.local');
    const cloneId = await seedCloneWithEditor(ownerA, 'l2_iso_c');
    const tokenA = await issueAccessToken(ownerA);
    const tokenB = await issueAccessToken(ownerB);

    await seedUserL2(cloneId, ownerA, { address: '성준', memories_personal: ['m1'] });

    const rA = await SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: 'PATCH',
      headers: authHeader(tokenA),
      body: JSON.stringify({ memory_summary: 'A의 기억' }),
    });
    expect(rA.status).toBe(200);
    expect((await rA.json() as { l2_profile: { memory_summary: string } }).l2_profile.memory_summary).toBe('A의 기억');

    const aRow = await db()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(cloneId, ownerA)
      .first<{ data: string }>();
    const aData = JSON.parse(aRow!.data);
    expect(aData.memory_summary).toBe('A의 기억');
    expect(aData.address).toBe('성준');             
    expect(aData.memories_personal).toEqual(['m1']); 

    const rB = await SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: 'PATCH',
      headers: authHeader(tokenB),
      body: JSON.stringify({ memory_summary: 'B의 기억' }),
    });
    expect(rB.status).toBe(200);

    const bRow = await db()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(cloneId, ownerB)
      .first<{ data: string }>();
    const bData = JSON.parse(bRow!.data);
    expect(bData.memory_summary).toBe('B의 기억');   

    const aRowAfter = await db()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(cloneId, ownerA)
      .first<{ data: string }>();
    expect(JSON.parse(aRowAfter!.data).memory_summary).toBe('A의 기억');
  });

  it('비인증은 401', async () => {
    const owner = await seedUser('l2-unauth@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'l2_unauth_c');
    const r = await SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory_summary: 'x' }),
    });
    expect(r.status).toBe(401);
  });

  it('알 수 없는 필드 → 422 (strict)', async () => {
    const owner = await seedUser('l2-strict@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'l2_strict_c');
    const token = await issueAccessToken(owner);
    const r = await SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ memory_summary: 'ok', unknown_field: 'nope' }),
    });
    expect(r.status).toBe(422);
  });

  it('빈 객체 → 422 (at least one field)', async () => {
    const owner = await seedUser('l2-empty@test.local');
    const cloneId = await seedCloneWithEditor(owner, 'l2_empty_c');
    const token = await issueAccessToken(owner);
    const r = await SELF.fetch(`http://localhost/oth-path${cloneId}/l2`, {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({}),
    });
    expect(r.status).toBe(422);
  });

  it('접근 권한 없는 비공개 클론에 L2 write → 403', async () => {
    const ownerA = await seedUser('l2-priv-owner@test.local');
    const nonMember = await seedUser('l2-priv-nonmember@test.local');
    const privateCloneId = await seedPrivateClone(ownerA, 'l2_priv_gate_c');
    const tokenB = await issueAccessToken(nonMember);

    const r = await SELF.fetch(`http://localhost/oth-path${privateCloneId}/l2`, {
      method: 'PATCH',
      headers: authHeader(tokenB),
      body: JSON.stringify({ memory_summary: 'x' }),
    });
    expect(r.status).toBe(403);
  });
});
