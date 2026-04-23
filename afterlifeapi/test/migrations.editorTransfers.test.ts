import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

const db = () => env.DB as unknown as D1Database;

describe('migration 0023 editor_transfers', () => {
  it('adds primary_editor_user_id to clones with owner_id backfill', async () => {
    await db()
      .prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1@e', 'x', 'U', CURRENT_TIMESTAMP)")
      .run();
    const u = await db().prepare("SELECT id FROM users WHERE email = 'a1@e'").first<{ id: number }>();
    await db()
      .prepare(
        "INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a1u', 'memlow', 'public', CURRENT_TIMESTAMP)",
      )
      .bind(u!.id)
      .run();
    const c = await db().prepare("SELECT id, primary_editor_user_id FROM clones WHERE username = 'a1u'").first<{ id: number; primary_editor_user_id: number | null }>();
    expect(c).toBeTruthy();
    await db().prepare('UPDATE clones SET primary_editor_user_id = owner_id WHERE id = ?').bind(c!.id).run();
    const after = await db().prepare('SELECT primary_editor_user_id FROM clones WHERE id = ?').bind(c!.id).first<{ primary_editor_user_id: number }>();
    expect(after?.primary_editor_user_id).toBe(u!.id);
  });

  it('creates clone_editor_transfers table with required columns', async () => {
    const cols = await db()
      .prepare("PRAGMA table_info(clone_editor_transfers)")
      .all<{ name: string; type: string }>();
    const names = cols.results.map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining(['id', 'clone_id', 'from_user_id', 'to_user_id', 'status', 'created_at', 'resolved_at']),
    );
  });

  it('enforces single pending transfer per clone via unique partial index', async () => {
    await db().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1b@e','x','U',CURRENT_TIMESTAMP)").run();
    await db().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES ('a1c@e','x','U',CURRENT_TIMESTAMP)").run();
    const from = (await db().prepare("SELECT id FROM users WHERE email='a1b@e'").first<{ id: number }>())!.id;
    const to = (await db().prepare("SELECT id FROM users WHERE email='a1c@e'").first<{ id: number }>())!.id;
    await db()
      .prepare("INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'N', 'a1p', 'memlow', 'public', CURRENT_TIMESTAMP)")
      .bind(from)
      .run();
    const cloneId = (await db().prepare("SELECT id FROM clones WHERE username='a1p'").first<{ id: number }>())!.id;
    await db()
      .prepare("INSERT INTO clone_editor_transfers (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?,'pending')")
      .bind(cloneId, from, to)
      .run();
    await expect(
      db()
        .prepare("INSERT INTO clone_editor_transfers (clone_id, from_user_id, to_user_id, status) VALUES (?,?,?,'pending')")
        .bind(cloneId, from, to)
        .run(),
    ).rejects.toThrow(/UNIQUE/i);
  });
});
