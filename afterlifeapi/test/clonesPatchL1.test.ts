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

async function v_bb226e(v_6e0fd3, v_43e90c, v_4d33b2): Promise<Response> {
  const v_21cc31 = await v_86c39f(v_43e90c);
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${v_21cc31}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2('PATCH /oth-path — L1 편집', () => {
  v_23805a('primary editor saves l1_profile and persona_attributes sync', async () => {
    const v_257b90 = await v_bfb240('a6a-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a6a_c');

    const v_8f00b9 = await v_bb226e(v_6e0fd3, v_257b90, {
      l1_profile: { attrs: { tone: 'warm', hobby: 'music' }, notes: 'loves jazz' },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_5885b8 = await v_a1651b()
      .prepare('SELECT l1_profile FROM clones WHERE id = ?')
      .bind(v_6e0fd3)
      .first<{ l1_profile: string }>();
    v_4d37e3(JSON.parse(v_5885b8!.l1_profile)).toEqual({
      attrs: { tone: 'warm', hobby: 'music' },
      notes: 'loves jazz',
    });

    const v_18b8bf = await v_a1651b()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level = 'l1' ORDER BY key")
      .bind(v_6e0fd3)
      .all<{ key: string; value: string }>();
    v_4d37e3(v_18b8bf.results).toEqual([
      { key: 'hobby', value: 'music' },
      { key: 'tone', value: 'warm' },
    ]);
  });

  v_23805a('persona_attributes is replaced on subsequent L1 patch (DELETE + INSERT)', async () => {
    const v_257b90 = await v_bfb240('a6b-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a6b_c');

    const v_ea719c = await v_bb226e(v_6e0fd3, v_257b90, {
      l1_profile: { attrs: { tone: 'warm', hobby: 'music' }, notes: '' },
    });
    v_4d37e3(v_ea719c.status).toBe(200);

    const v_486a80 = await v_bb226e(v_6e0fd3, v_257b90, {
      l1_profile: { attrs: { tone: 'sharp' }, notes: 'updated' },
    });
    v_4d37e3(v_486a80.status).toBe(200);

    const v_18b8bf = await v_a1651b()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level = 'l1' ORDER BY key")
      .bind(v_6e0fd3)
      .all<{ key: string; value: string }>();
    v_4d37e3(v_18b8bf.results).toEqual([{ key: 'tone', value: 'sharp' }]);
  });

  v_23805a('accepted-share owner (not primary editor) → 403 on L1 edit', async () => {
    const v_257b90 = await v_bfb240('a6c-o@test.local');
    const v_583293 = await v_bfb240('a6c-co@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a6c_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_583293);

    const v_8f00b9 = await v_bb226e(v_6e0fd3, v_583293, {
      l1_profile: { attrs: { tone: 'sharp' }, notes: '' },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a('non-L1 field edit by accepted-share owner still works (existing behavior intact)', async () => {
    const v_257b90 = await v_bfb240('a6d-o@test.local');
    const v_583293 = await v_bfb240('a6d-co@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a6d_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_583293);

    const v_8f00b9 = await v_bb226e(v_6e0fd3, v_583293, { name: 'Renamed' });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a('l2_profile in body → 422 VALIDATION_FAILED (strict schema)', async () => {
    const v_257b90 = await v_bfb240('a6e-o@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a6e_c');

    const v_8f00b9 = await v_bb226e(v_6e0fd3, v_257b90, {
      name: 'ok',
      l2_profile: { anything: 'nope' },
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});
