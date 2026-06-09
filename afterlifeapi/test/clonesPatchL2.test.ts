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

async function v_6682f9(v_6e0fd3, v_1af19b): Promise<void> {
  await v_a1651b()
    .prepare("UPDATE clones SET l2_profile = ? WHERE id = ?")
    .bind(JSON.stringify(v_1af19b), v_6e0fd3)
    .run();
}

async function v_d31e4f(v_6e0fd3, v_1badb6, v_489382): Promise<void> {
  await v_a1651b()
    .prepare("INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')")
    .bind(v_6e0fd3, v_1badb6, v_489382)
    .run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import('../src/lib/jwt');
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error('JWT_ACCESS_SECRET missing');
  return v_b2eae5({ sub: v_43e90c, kind: 'access' }, v_43fd42, 60 * 10);
}

async function v_862d3d(v_6e0fd3, v_43e90c, v_4d33b2): Promise<Response> {
  const v_21cc31 = await v_86c39f(v_43e90c);
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/l2`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${v_21cc31}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2('PATCH /oth-path — L2 대화 기억 병합 갱신', () => {
  v_23805a('owner가 4필드 부분 갱신 → 200, 미지정 필드 보존, 지정 필드 갱신', async () => {
    const v_257b90 = await v_bfb240('b1a-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'b1a_c');

    await v_6682f9(v_6e0fd3, {
      memory_summary: 'old summary',
      relationship: 'old rel',
      context: 'old ctx',
      recent_topics: 'old topics',
    });

    const v_8f00b9 = await v_862d3d(v_6e0fd3, v_257b90, {
      memory_summary: 'new summary',
      context: 'new ctx',
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_5885b8 = await v_a1651b()
      .prepare('SELECT l2_profile FROM clones WHERE id = ?')
      .bind(v_6e0fd3)
      .first<{ l2_profile: string }>();
    const v_8decf8 = JSON.parse(v_5885b8!.l2_profile);

    v_4d37e3(v_8decf8.memory_summary).toBe('new summary');
    v_4d37e3(v_8decf8.context).toBe('new ctx');

    v_4d37e3(v_8decf8.relationship).toBe('old rel');
    v_4d37e3(v_8decf8.recent_topics).toBe('old topics');
  });

  v_23805a('l2_profile 없는 클론에 신규 필드 작성 → 200, 지정 필드만 저장', async () => {
    const v_257b90 = await v_bfb240('b1b-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'b1b_c');

    const v_8f00b9 = await v_862d3d(v_6e0fd3, v_257b90, {
      memory_summary: 'brand new',
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_5885b8 = await v_a1651b()
      .prepare('SELECT l2_profile FROM clones WHERE id = ?')
      .bind(v_6e0fd3)
      .first<{ l2_profile: string }>();
    const v_8decf8 = JSON.parse(v_5885b8!.l2_profile);
    v_4d37e3(v_8decf8.memory_summary).toBe('brand new');
  });

  v_23805a('비-owner(일반 유저) → 403', async () => {
    const v_257b90 = await v_bfb240('b1c-o@test.local');
    const v_a9cbf1 = await v_bfb240('b1c-other@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'b1c_c');

    const v_8f00b9 = await v_862d3d(v_6e0fd3, v_a9cbf1, {
      memory_summary: 'hack',
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a('알 수 없는 필드 → 422 (strict)', async () => {
    const v_257b90 = await v_bfb240('b1d-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'b1d_c');

    const v_8f00b9 = await v_862d3d(v_6e0fd3, v_257b90, {
      memory_summary: 'ok',
      unknown_field: 'nope',
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a('빈 객체 → 422 (at least one field)', async () => {
    const v_257b90 = await v_bfb240('b1e-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'b1e_c');

    const v_8f00b9 = await v_862d3d(v_6e0fd3, v_257b90, {});
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});
