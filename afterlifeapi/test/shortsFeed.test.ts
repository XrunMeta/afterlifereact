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

async function v_4d24a9(v_1badb6, v_556427, v_818579, v_3a8949 = 'memlow'): Promise<number> {
  await v_a1651b()
    .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, ?, ?, CURRENT_TIMESTAMP)")
    .bind(v_1badb6, v_556427, v_3a8949, v_818579)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_0ecb3a(v_6e0fd3, v_d308b5, v_1458b7 = null): Promise<number> {
  const v_43af15 = await v_a1651b()
    .prepare("INSERT INTO clone_shorts (clone_id, status, media_url) VALUES (?, ?, ?) RETURNING id")
    .bind(v_6e0fd3, v_d308b5, v_1458b7)
    .first<{ id: number }>();
  return v_43af15!.id;
}

async function v_d31e4f(v_6e0fd3, v_1badb6, v_489382): Promise<void> {
  await v_a1651b()
    .prepare("INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status) VALUES (?,?,?, 'owner','accepted')")
    .bind(v_6e0fd3, v_1badb6, v_489382)
    .run();
}

async function v_7c86dd(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare("UPDATE clones SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(v_6e0fd3)
    .run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import('../src/lib/jwt');
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error('JWT_ACCESS_SECRET missing');
  return v_b2eae5({ sub: v_43e90c, kind: 'access' }, v_43fd42, 60 * 10);
}

async function v_de0dad(v_43e90c): Promise<Response> {
  const v_21cc31 = await v_86c39f(v_43e90c);
  return v_1df298.fetch('http://localhost/oth-path', {
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
}

v_469bf2('GET /oth-path — 피드', () => {
  v_23805a('unauthenticated → 401', async () => {
    const v_8f00b9 = await v_1df298.fetch('http://localhost/oth-path');
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("returns public + owner-private + accepted-share-owner private; excludes strangers' private", async () => {
    const v_debed8 = await v_bfb240('a7a-viewer@test.local');
    const v_1c6644 = await v_bfb240('a7a-stranger@test.local');

    const v_af862b = await v_4d24a9(v_1c6644, 'a7a_pub', 'public', 'friend');
    const v_01b51a = await v_4d24a9(v_debed8, 'a7a_mine', 'private', 'memlow');
    const v_5fcf61 = await v_4d24a9(v_1c6644, 'a7a_co', 'private', 'memlow');
    await v_d31e4f(v_5fcf61, v_1c6644, v_debed8);
    const v_913e99 = await v_4d24a9(v_1c6644, 'a7a_hidden', 'private', 'mentor');

    await v_0ecb3a(v_af862b, 'ready', 'https://cdn/pub.mp4');
    await v_0ecb3a(v_01b51a, 'ready', 'https://cdn/mine.mp4');
    await v_0ecb3a(v_5fcf61, 'ready', 'https://cdn/co.mp4');
    await v_0ecb3a(v_913e99, 'ready', 'https://cdn/hidden.mp4');

    const v_8f00b9 = await v_de0dad(v_debed8);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { items: Array<{ cloneId: number }>; nextCursor: string | null };
    const v_8b86f5 = v_4d33b2.items.map((v_62c214) => v_62c214.cloneId);
    v_4d37e3(v_8b86f5).toEqual(v_4d37e3.arrayContaining([v_af862b, v_01b51a, v_5fcf61]));
    v_4d37e3(v_8b86f5).not.toContain(v_913e99);
    v_4d37e3(v_4d33b2.nextCursor).toBeNull();
  });

  v_23805a('excludes non-ready statuses (queued/processing/failed)', async () => {
    const v_debed8 = await v_bfb240('a7b-viewer@test.local');
    const v_af862b = await v_4d24a9(v_debed8, 'a7b_pub', 'public');

    await v_0ecb3a(v_af862b, 'queued');
    await v_0ecb3a(v_af862b, 'processing');
    await v_0ecb3a(v_af862b, 'failed', null);
    const v_51fcf8 = await v_0ecb3a(v_af862b, 'ready', 'https://cdn/ready.mp4');

    const v_8f00b9 = await v_de0dad(v_debed8);
    const v_4d33b2 = (await v_8f00b9.json()) as { items: Array<{ shortId: number }> };
    const v_52e08b = v_4d33b2.items.map((v_62c214) => v_62c214.shortId);
    v_4d37e3(v_52e08b).toEqual([v_51fcf8]);
  });

  v_23805a('excludes shorts whose clone is soft-deleted', async () => {
    const v_debed8 = await v_bfb240('a7c-viewer@test.local');
    const v_78d357 = await v_4d24a9(v_debed8, 'a7c_good', 'public', 'memlow');
    const v_e6d2aa = await v_4d24a9(v_debed8, 'a7c_dead', 'public', 'friend');
    const v_74ae7f = await v_0ecb3a(v_78d357, 'ready', 'https://cdn/good.mp4');
    await v_0ecb3a(v_e6d2aa, 'ready', 'https://cdn/dead.mp4');
    await v_7c86dd(v_e6d2aa);

    const v_8f00b9 = await v_de0dad(v_debed8);
    const v_4d33b2 = (await v_8f00b9.json()) as { items: Array<{ shortId: number }> };
    v_4d37e3(v_4d33b2.items.map((v_62c214) => v_62c214.shortId)).toEqual([v_74ae7f]);
  });

  v_23805a('response item shape: shortId, cloneId, mediaUrl, name, cloneType', async () => {
    const v_debed8 = await v_bfb240('a7d-viewer@test.local');
    const v_6e0fd3 = await v_4d24a9(v_debed8, 'a7d_pub', 'public', 'friend');
    const v_53aa09 = await v_0ecb3a(v_6e0fd3, 'ready', 'https://cdn/x.mp4');

    const v_8f00b9 = await v_de0dad(v_debed8);
    const v_4d33b2 = (await v_8f00b9.json()) as { items: Array<Record<string, unknown>> };
    const v_8c0b26 = v_4d33b2.items.find((v_62c214) => v_62c214.shortId === v_53aa09);
    v_4d37e3(v_8c0b26).toBeDefined();
    v_4d37e3(v_8c0b26).toMatchObject({
      shortId: v_53aa09,
      cloneId: v_6e0fd3,
      mediaUrl: 'https://cdn/x.mp4',
      cloneType: 'friend',
    });
    v_4d37e3(typeof v_8c0b26!.name).toBe('string');
  });
});
