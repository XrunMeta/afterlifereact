import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_1df298, v_c9c489 } from 'lwkoweqmjbnvjqw';

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)")
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4a0208(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', ?, CURRENT_TIMESTAMP)")
    .bind(v_1badb6, v_556427, v_1badb6)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_c5e469(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, primary_editor_user_id, created_at) VALUES (?, 'CT', ?, 'memlow', 'private', ?, CURRENT_TIMESTAMP)")
    .bind(v_1badb6, v_556427, v_1badb6)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_bb6c09(v_6e0fd3, v_43e90c, v_9390e8): Promise<void> {
  await v_a1651b()
    .prepare(
      "INSERT INTO clone_ont (clone_id,user_id,data,updated_at) VALUES (?,?,?,unixepoch()) " +
      "ON CONFLICT(clone_id,user_id) DO UPDATE SET data=excluded.data"
    )
    .bind(v_6e0fd3, v_43e90c, JSON.stringify(v_9390e8))
    .run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import('../src/lib/jwt');
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error('JWT_ACCESS_SECRET missing');
  return v_b2eae5({ sub: v_43e90c, kind: 'access' }, v_43fd42, 60 * 10);
}

function v_5c1e3a(v_21cc31) {
  return { Authorization: `Bearer ${v_21cc31}`, 'Content-Type': 'application/json' };
}

v_469bf2('PATCH /oth-path — clone_ont 사용자별 L2 갱신', () => {
  v_23805a('자기 L2 저장 + 두 사용자 격리 + 채팅 필드 보존', async () => {
    const v_9b59f6 = await v_bfb240('l2-a@test.local');
    const v_f68556 = await v_bfb240('l2-b@test.local');
    const v_6e0fd3 = await v_4a0208(v_9b59f6, 'l2_iso_c');
    const v_706f17 = await v_86c39f(v_9b59f6);
    const v_3d7097 = await v_86c39f(v_f68556);

    await v_bb6c09(v_6e0fd3, v_9b59f6, { address: '성준', memories_personal: ['m1'] });

    const v_8dc927 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: 'PATCH',
      headers: v_5c1e3a(v_706f17),
      body: JSON.stringify({ memory_summary: 'A의 기억' }),
    });
    v_4d37e3(v_8dc927.status).toBe(200);
    v_4d37e3((await v_8dc927.json() as { l2_profile: { memory_summary: string } }).l2_profile.memory_summary).toBe('A의 기억');

    const v_2bf146 = await v_a1651b()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(v_6e0fd3, v_9b59f6)
      .first<{ data: string }>();
    const v_9e79cf = JSON.parse(v_2bf146!.data);
    v_4d37e3(v_9e79cf.memory_summary).toBe('A의 기억');
    v_4d37e3(v_9e79cf.address).toBe('성준');             
    v_4d37e3(v_9e79cf.memories_personal).toEqual(['m1']); 

    const v_bc5597 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: 'PATCH',
      headers: v_5c1e3a(v_3d7097),
      body: JSON.stringify({ memory_summary: 'B의 기억' }),
    });
    v_4d37e3(v_bc5597.status).toBe(200);

    const v_b1881e = await v_a1651b()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(v_6e0fd3, v_f68556)
      .first<{ data: string }>();
    const v_cfd7cd = JSON.parse(v_b1881e!.data);
    v_4d37e3(v_cfd7cd.memory_summary).toBe('B의 기억');   

    const v_5e7f46 = await v_a1651b()
      .prepare('SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?')
      .bind(v_6e0fd3, v_9b59f6)
      .first<{ data: string }>();
    v_4d37e3(JSON.parse(v_5e7f46!.data).memory_summary).toBe('A의 기억');
  });

  v_23805a('비인증은 401', async () => {
    const v_257b90 = await v_bfb240('l2-unauth@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'l2_unauth_c');
    const v_cb35cb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memory_summary: 'x' }),
    });
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a('알 수 없는 필드 → 422 (strict)', async () => {
    const v_257b90 = await v_bfb240('l2-strict@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'l2_strict_c');
    const v_21cc31 = await v_86c39f(v_257b90);
    const v_cb35cb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: 'PATCH',
      headers: v_5c1e3a(v_21cc31),
      body: JSON.stringify({ memory_summary: 'ok', unknown_field: 'nope' }),
    });
    v_4d37e3(v_cb35cb.status).toBe(422);
  });

  v_23805a('빈 객체 → 422 (at least one field)', async () => {
    const v_257b90 = await v_bfb240('l2-empty@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'l2_empty_c');
    const v_21cc31 = await v_86c39f(v_257b90);
    const v_cb35cb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
      method: 'PATCH',
      headers: v_5c1e3a(v_21cc31),
      body: JSON.stringify({}),
    });
    v_4d37e3(v_cb35cb.status).toBe(422);
  });

  v_23805a('접근 권한 없는 비공개 클론에 L2 write → 403', async () => {
    const v_9b59f6 = await v_bfb240('l2-priv-owner@test.local');
    const v_64e51d = await v_bfb240('l2-priv-nonmember@test.local');
    const v_1de688 = await v_c5e469(v_9b59f6, 'l2_priv_gate_c');
    const v_3d7097 = await v_86c39f(v_64e51d);

    const v_cb35cb = await v_1df298.fetch(`http://localhost/oth-path${v_1de688}/l2`, {
      method: 'PATCH',
      headers: v_5c1e3a(v_3d7097),
      body: JSON.stringify({ memory_summary: 'x' }),
    });
    v_4d37e3(v_cb35cb.status).toBe(403);
  });
});
