import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_c9c489 } from 'lwkoweqmjbnvjqw';

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

v_469bf2('migration 0024 persona_attributes', () => {
  v_23805a('creates persona_attributes with composite unique (clone_id, level, key)', async () => {
    await v_a1651b().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a2@e','x','U',CURRENT_TIMESTAMP)").run();
    const v_ceb55a = (await v_a1651b().prepare("SELECT id FROM users WHERE email='a2@e'").first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a2u', 'memlow', 'public', CURRENT_TIMESTAMP)")
      .bind(v_ceb55a)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare("SELECT id FROM clones WHERE username='a2u'").first<{ id: number }>())!.id;

    await v_a1651b()
      .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
      .bind(v_6e0fd3, 'l1', 'tone', 'warm')
      .run();

    await v_4d37e3(
      v_a1651b()
        .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
        .bind(v_6e0fd3, 'l1', 'tone', 'sharp')
        .run(),
    ).rejects.toThrow(/UNIQUE/i);

    await v_a1651b()
      .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
      .bind(v_6e0fd3, 'l1', 'hobby', 'reading')
      .run();
    const v_18b8bf = await v_a1651b()
      .prepare("SELECT key FROM persona_attributes WHERE clone_id = ? ORDER BY key")
      .bind(v_6e0fd3)
      .all<{ key: string }>();
    v_4d37e3(v_18b8bf.results.map((v_cb35cb) => v_cb35cb.key)).toEqual(['hobby', 'tone']);
  });
});
