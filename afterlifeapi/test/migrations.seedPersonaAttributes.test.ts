import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

const db = () => env.DB as unknown as D1Database;

const SEED_SQL = `
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

describe('migration 0025 seed_persona_attributes (idempotent backfill SQL)', () => {
  it('seeds persona_attributes rows from l1_profile.attrs and is idempotent', async () => {
    await db().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a3@e','x','U',CURRENT_TIMESTAMP)").run();
    const u = (await db().prepare("SELECT id FROM users WHERE email='a3@e'").first<{ id: number }>())!.id;
    const l1 = JSON.stringify({ attrs: { tone: 'warm', hobby: 'reading' }, notes: '' });
    await db()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, l1_profile, created_at) VALUES (?, 'N', 'a3u', 'memlow', 'public', ?, CURRENT_TIMESTAMP)",
      )
      .bind(u, l1)
      .run();
    const cloneId = (await db().prepare("SELECT id FROM clones WHERE username='a3u'").first<{ id: number }>())!.id;

    await db().exec(SEED_SQL.replace(/\n/g, ' '));
    const first = await db()
      .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level='l1' ORDER BY key")
      .bind(cloneId)
      .all<{ key: string; value: string }>();
    expect(first.results).toEqual([
      { key: 'hobby', value: 'reading' },
      { key: 'tone', value: 'warm' },
    ]);

    await db().exec(SEED_SQL.replace(/\n/g, ' '));
    const countRow = await db()
      .prepare("SELECT COUNT(*) AS c FROM persona_attributes WHERE clone_id = ?")
      .bind(cloneId)
      .first<{ c: number }>();
    expect(countRow!.c).toBe(2);
  });
});
