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

async function v_2d0f74(v_6e0fd3, v_96a0b7, v_56609b): Promise<Response> {
  const v_21cc31 = await v_86c39f(v_96a0b7);
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/editor-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${v_21cc31}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId: v_56609b }),
  });
}

v_469bf2('POST /oth-path', () => {
  v_23805a('primary editor creates pending transfer to an accepted-share coowner', async () => {
    const v_257b90 = await v_bfb240('a5a-o@test.local');
    const v_5f5d6d = await v_bfb240('a5a-t@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5a_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_8f00b9 = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = (await v_8f00b9.json()) as { id: number; status: string; toUserId: number };
    v_4d37e3(typeof v_4d33b2.id).toBe('number');
    v_4d37e3(v_4d33b2.status).toBe('pending');
    v_4d37e3(v_4d33b2.toUserId).toBe(v_5f5d6d);
  });

  v_23805a('second pending while one exists → 409 CONFLICT', async () => {
    const v_257b90 = await v_bfb240('a5b-o@test.local');
    const v_5f5d6d = await v_bfb240('a5b-t@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5b_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_ea719c = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    v_4d37e3(v_ea719c.status).toBe(201);
    const v_486a80 = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    v_4d37e3(v_486a80.status).toBe(409);
  });

  v_23805a('non-primary-editor → 403', async () => {
    const v_257b90 = await v_bfb240('a5c-o@test.local');
    const v_a9cbf1 = await v_bfb240('a5c-x@test.local');
    const v_5f5d6d = await v_bfb240('a5c-t@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5c_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_8f00b9 = await v_2d0f74(v_6e0fd3, v_a9cbf1, v_5f5d6d);
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a('recipient not an accepted-share owner → 422 VALIDATION_FAILED', async () => {
    const v_257b90 = await v_bfb240('a5d-o@test.local');
    const v_1c6644 = await v_bfb240('a5d-s@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5d_c');
    const v_8f00b9 = await v_2d0f74(v_6e0fd3, v_257b90, v_1c6644);
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});

v_469bf2('POST /oth-path', () => {
  v_23805a('recipient accepts → primary_editor_user_id becomes recipient', async () => {
    const v_257b90 = await v_bfb240('a5e-o@test.local');
    const v_5f5d6d = await v_bfb240('a5e-t@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5e_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_5d98f0 = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    const { id: v_389afb } = (await v_5d98f0.json()) as { id: number };

    const v_0450e0 = await v_86c39f(v_5f5d6d);
    const v_766000 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/editor-transfer/${v_389afb}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_0450e0}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    v_4d37e3(v_766000.status).toBe(200);
    const v_3ac7e7 = await v_a1651b()
      .prepare('SELECT primary_editor_user_id FROM clones WHERE id = ?')
      .bind(v_6e0fd3)
      .first<{ primary_editor_user_id: number }>();
    v_4d37e3(v_3ac7e7?.primary_editor_user_id).toBe(v_5f5d6d);
  });

  v_23805a('non-recipient cannot respond → 403', async () => {
    const v_257b90 = await v_bfb240('a5f-o@test.local');
    const v_5f5d6d = await v_bfb240('a5f-t@test.local');
    const v_a9cbf1 = await v_bfb240('a5f-x@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5f_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_5d98f0 = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    const { id: v_389afb } = (await v_5d98f0.json()) as { id: number };

    const v_3d32ae = await v_86c39f(v_a9cbf1);
    const v_766000 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/editor-transfer/${v_389afb}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_3d32ae}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    v_4d37e3(v_766000.status).toBe(403);
  });

  v_23805a('responding to already-resolved transfer → 409 CONFLICT', async () => {
    const v_257b90 = await v_bfb240('a5g-o@test.local');
    const v_5f5d6d = await v_bfb240('a5g-t@test.local');
    const v_6e0fd3 = await v_4a0208(v_257b90, 'a5g_c');
    await v_d31e4f(v_6e0fd3, v_257b90, v_5f5d6d);
    const v_5d98f0 = await v_2d0f74(v_6e0fd3, v_257b90, v_5f5d6d);
    const { id: v_389afb } = (await v_5d98f0.json()) as { id: number };
    const v_0450e0 = await v_86c39f(v_5f5d6d);

    const v_ea719c = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/editor-transfer/${v_389afb}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_0450e0}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'decline' }),
    });
    v_4d37e3(v_ea719c.status).toBe(200);

    const v_486a80 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/editor-transfer/${v_389afb}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_0450e0}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accept' }),
    });
    v_4d37e3(v_486a80.status).toBe(409);
  });
});
