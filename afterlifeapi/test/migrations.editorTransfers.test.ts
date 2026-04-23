import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_c9c489 } from 'lwkoweqmjbnvjqw';

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

v_469bf2('migration 0023 editor_transfers', () => {
  v_23805a('adds primary_editor_user_id to clones with owner_id backfill', async () => {
    await v_a1651b()
      .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1@e', 'x', 'U', CURRENT_TIMESTAMP)")
      .run();
    const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = 'a1@e'").first<{ id: number }>();
    await v_a1651b()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a1u', 'memlow', 'public', CURRENT_TIMESTAMP)",
      )
      .bind(v_ceb55a!.id)
      .run();
    const v_3f4e2e = await v_a1651b().prepare("SELECT id, primary_editor_user_id FROM clones WHERE username = 'a1u'").first<{ id: number; primary_editor_user_id: number | null }>();
    v_4d37e3(v_3f4e2e).toBeTruthy();
    await v_a1651b().prepare('UPDATE clones SET primary_editor_user_id = owner_id WHERE id = ?').bind(v_3f4e2e!.id).run();
    const v_33efc5 = await v_a1651b().prepare('SELECT primary_editor_user_id FROM clones WHERE id = ?').bind(v_3f4e2e!.id).first<{ primary_editor_user_id: number }>();
    v_4d37e3(v_33efc5?.primary_editor_user_id).toBe(v_ceb55a!.id);
  });

  v_23805a('creates clonoth-secretrs table with required columns', async () => {
    const v_6c1676 = await v_a1651b()
      .prepare("PRAGMA table_info(clonoth-secretrs)")
      .all<{ name: string; type: string }>();
    const v_77b1ac = v_6c1676.results.map((v_cb35cb) => v_cb35cb.name);
    v_4d37e3(v_77b1ac).toEqual(
      v_4d37e3.arrayContaining(['id', 'clone_id', 'from_user_id', 'to_user_id', 'status', 'created_at', 'resolved_at']),
    );
  });

  v_23805a('enforces single pending transfer per clone via unique partial index', async () => {
    await v_a1651b().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1b@e','x','U',CURRENT_TIMESTAMP)").run();
    await v_a1651b().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1c@e','x','U',CURRENT_TIMESTAMP)").run();
    const v_a13c2e = (await v_a1651b().prepare("SELECT id FROM users WHERE email='a1b@e'").first<{ id: number }>())!.id;
    const v_257132 = (await v_a1651b().prepare("SELECT id FROM users WHERE email='a1c@e'").first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a1p', 'memlow', 'public', CURRENT_TIMESTAMP)")
      .bind(v_a13c2e)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare("SELECT id FROM clones WHERE username='a1p'").first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare("INSERT INTO clonoth-secretrs (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?,'pending')")
      .bind(v_6e0fd3, v_a13c2e, v_257132)
      .run();
    await v_4d37e3(
      v_a1651b()
        .prepare("INSERT INTO clonoth-secretrs (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?,'pending')")
        .bind(v_6e0fd3, v_a13c2e, v_257132)
        .run(),
    ).rejects.toThrow(/UNIQUE/i);
  });
});
