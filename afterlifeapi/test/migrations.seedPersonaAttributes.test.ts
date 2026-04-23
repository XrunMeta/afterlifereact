import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_c9c489 } from 'lwkoweqmjbnvjqw';

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

const v_8b3f25 = `
INSERT INTO persona_attributes (clone_id, level, key, value)
SELECT
  c.id, 'l1', je.key, CAST(je.value AS TEXT)
FROM clones c, json_each(json_extract(c.l1_profile, '$.attrs')) je
WHERE c.l1_profile IS NOT NULL
  AND json_valid(c.l1_profile)
  AND json_extract(c.l1_profile, '$.attrs') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM persona_attributes pa
    WHERE pa.clone_id = c.id AND pa.level = 'l1' AND pa.key = je.key
  );
`;

v_469bf2('migration 0025 seed_persona_attributes (idempotent backfill SQL)', () => {
  v_23805a('seeds persona_attributes rows from l1_profile.attrs and is idempotent', async () => {
    await v_a1651b().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a3@e','x','U',CURRENT_TIMESTAMP)").run();
    const v_ceb55a = (await v_a1651b().prepare("SELECT id FROM users WHERE email='a3@e'").first<{ id: number }>())!.id;
    const v_020b4b = JSON.stringify({ attrs: { tone: 'warm', hobby: 'reading' }, notes: '' });
    await v_a1651b()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, l1_profile, created_at) VALUES (?, 'N', 'a3u', 'memlow', 'public', ?, CURRENT_TIMESTAMP)",
      )
      .bind(v_ceb55a, v_020b4b)
      .run();
    const v_6e0fd3 = (await v_a1651b().prepare("SELECT id FROM clones WHERE username='a3u'").first<{ id: number }>())!.id;

    await v_a1651b().exec(v_8b3f25.replace(/\n/g, ' '));
    const v_ea719c = await v_a1651b()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level='l1' ORDER BY key")
      .bind(v_6e0fd3)
      .all<{ key: string; value: string }>();
    v_4d37e3(v_ea719c.results).toEqual([
      { key: 'hobby', value: 'reading' },
      { key: 'tone', value: 'warm' },
    ]);

    await v_a1651b().exec(v_8b3f25.replace(/\n/g, ' '));
    const v_d90e7b = await v_a1651b()
      .prepare("SELECT COUNT(*) AS c FROM persona_attributes WHERE clone_id = ?")
      .bind(v_6e0fd3)
      .first<{ c: number }>();
    v_4d37e3(v_d90e7b!.c).toBe(2);
  });
});
