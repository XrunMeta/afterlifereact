import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_1df298, v_c9c489 } from 'lwkoweqmjbnvjqw';

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)")
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)")
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import('../src/lib/jwt');
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error('JWT_ACCESS_SECRET missing');
  return v_b2eae5({ sub: v_43e90c, kind: 'access' }, v_43fd42, 60 * 10);
}

v_469bf2('POST /oth-path', () => {
  v_23805a('owner enqueues a short and receives status=queued', async () => {
    const v_1badb6 = await v_bfb240('a4-owner@test.local');
    const v_6e0fd3 = await v_4d24a9(v_1badb6, 'a4_owner_c');
    const v_21cc31 = await v_86c39f(v_1badb6);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(202);
    const v_4d33b2 = (await v_8f00b9.json()) as { shortId: number; status: string };
    v_4d37e3(typeof v_4d33b2.shortId).toBe('number');
    v_4d37e3(v_4d33b2.status).toBe('queued');
  });

  v_23805a('non-owner receives 403', async () => {
    const v_1badb6 = await v_bfb240('a4-deny-o@test.local');
    const v_6e0fd3 = await v_4d24a9(v_1badb6, 'a4_deny_c');
    const v_0b00e8 = await v_bfb240('a4-deny-s@test.local');
    const v_21cc31 = await v_86c39f(v_0b00e8);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a('unauthenticated receives 401', async () => {
    const v_1badb6 = await v_bfb240('a4-anon-o@test.local');
    const v_6e0fd3 = await v_4d24a9(v_1badb6, 'a4_anon_c');
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/shorts/generate`, {
      method: 'POST',
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});

v_469bf2('GET /oth-path', () => {
  v_23805a('returns status + mediaUrl for owner-initiated short', async () => {
    const v_1badb6 = await v_bfb240('a4-get-o@test.local');
    const v_6e0fd3 = await v_4d24a9(v_1badb6, 'a4_get_c');
    const v_21cc31 = await v_86c39f(v_1badb6);
    const v_515384 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/shorts/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    const { shortId: v_53aa09 } = (await v_515384.json()) as { shortId: number; status: string };
    const v_511cca = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/shorts/${v_53aa09}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_511cca.status).toBe(200);
    const v_4d33b2 = (await v_511cca.json()) as { shortId: number; status: string; mediaUrl: string | null };
    v_4d37e3(v_4d33b2.shortId).toBe(v_53aa09);
    v_4d37e3(v_4d33b2.status).toBe('queued');
    v_4d37e3(v_4d33b2.mediaUrl).toBeNull();
  });
});
