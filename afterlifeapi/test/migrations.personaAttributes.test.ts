import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

const db = () => env.DB as unknown as D1Database;

describe('migration 0024 persona_attributes', () => {
  it('creates persona_attributes with composite unique (clone_id, level, key)', async () => {
    await db().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a2@e','x','U',CURRENT_TIMESTAMP)").run();
    const u = (await db().prepare("SELECT id FROM users WHERE email='a2@e'").first<{ id: number }>())!.id;
    await db()
      .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a2u', 'memlow', 'public', CURRENT_TIMESTAMP)")
      .bind(u)
      .run();
    const cloneId = (await db().prepare("SELECT id FROM clones WHERE username='a2u'").first<{ id: number }>())!.id;

    await db()
      .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
      .bind(cloneId, 'l1', 'tone', 'warm')
      .run();

    await expect(
      db()
        .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
        .bind(cloneId, 'l1', 'tone', 'sharp')
        .run(),
    ).rejects.toThrow(/UNIQUE/i);

    await db()
      .prepare("INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?,?,?,?)")
      .bind(cloneId, 'l1', 'hobby', 'reading')
      .run();
    const rows = await db()
      .prepare("SELECT key FROM persona_attributes WHERE clone_id = ? ORDER BY key")
      .bind(cloneId)
      .all<{ key: string }>();
    expect(rows.results.map((r) => r.key)).toEqual(['hobby', 'tone']);
  });
});
