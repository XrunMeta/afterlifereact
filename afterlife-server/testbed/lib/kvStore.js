import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const DB_PATH =
  process.env.LEARNING_DB_PATH ?? path.join(__dirname, '..', 'data', 'learning.db');

export const CATEGORIES = ['profile', 'preference', 'health', 'relationship', 'episode', 'misc'];

let _db = null;
function getDb() {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS persona_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clone_id INTEGER,
      persona_slug TEXT NOT NULL,
      level TEXT NOT NULL CHECK (level IN ('l1','l2')),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'misc',
      confidence REAL,
      status TEXT NOT NULL DEFAULT 'active',
      user_ref INTEGER,
      user_label TEXT,
      source_turn_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_pa_l1 ON persona_attributes(persona_slug, level, key)
      WHERE level='l1' AND status='active';
    CREATE UNIQUE INDEX IF NOT EXISTS ux_pa_l2 ON persona_attributes(persona_slug, user_label, level, key)
      WHERE level='l2' AND status='active';
    CREATE INDEX IF NOT EXISTS idx_pa_lookup ON persona_attributes(persona_slug, level, status);
    CREATE TABLE IF NOT EXISTS persona_attribute_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attr_id INTEGER NOT NULL,
      op TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      source_turn_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return _db;
}

function findActive(d, ctx, key) {
  if (ctx.level === 'l2') {
    return d.prepare(
      `SELECT * FROM persona_attributes
       WHERE persona_slug=? AND level='l2' AND status='active' AND user_label IS ? AND key=?`,
    ).get(ctx.persona_slug, ctx.user_label ?? null, key);
  }
  return d.prepare(
    `SELECT * FROM persona_attributes
     WHERE persona_slug=? AND level='l1' AND status='active' AND key=?`,
  ).get(ctx.persona_slug, key);
}

function ownedActive(d, ctx, id) {
  const row = d.prepare(`SELECT * FROM persona_attributes WHERE id=? AND status='active'`).get(id);
  if (!row) return null;
  if (row.persona_slug !== ctx.persona_slug || row.level !== ctx.level) return null;
  if (ctx.level === 'l2' && (row.user_label ?? null) !== (ctx.user_label ?? null)) return null;
  return row;
}

export function applyOps(ctx, ops) {
  if (!Array.isArray(ops) || ops.length === 0) return { applied: 0, rejected: 0 };
  const d = getDb();
  const now = `datetime('now')`;
  const insert = d.prepare(
    `INSERT INTO persona_attributes
       (clone_id, persona_slug, level, key, value, category, confidence, user_ref, user_label, source_turn_id)
     VALUES (NULL, @persona_slug, @level, @key, @value, @category, @confidence, NULL, @user_label, @source_turn_id)`,
  );
  const setVal = d.prepare(
    `UPDATE persona_attributes SET value=@value, confidence=@confidence,
       category=COALESCE(@category, category), source_turn_id=@source_turn_id, updated_at=${now} WHERE id=@id`,
  );
  const softDel = d.prepare(`UPDATE persona_attributes SET status='deleted', updated_at=${now} WHERE id=@id`);
  const addHist = d.prepare(
    `INSERT INTO persona_attribute_history (attr_id, op, old_value, new_value, reason, source_turn_id)
     VALUES (@attr_id, @op, @old_value, @new_value, @reason, @source_turn_id)`,
  );

  const run = d.transaction((opsList) => {
    let applied = 0, rejected = 0;
    for (const op of opsList) {
      try {
        if (op.op === 'add') {
          const existing = findActive(d, ctx, op.key);
          if (existing) {
            setVal.run({ id: existing.id, value: op.value, confidence: op.confidence ?? null,
              category: op.category ?? null, source_turn_id: ctx.source_turn_id ?? null });
            addHist.run({ attr_id: existing.id, op: 'update', old_value: existing.value,
              new_value: op.value, reason: op.reason ?? 'add→update(중복)', source_turn_id: ctx.source_turn_id ?? null });
          } else {
            const info = insert.run({ persona_slug: ctx.persona_slug, level: ctx.level, key: op.key,
              value: op.value, category: op.category ?? 'misc', confidence: op.confidence ?? null,
              user_label: ctx.user_label ?? null, source_turn_id: ctx.source_turn_id ?? null });
            addHist.run({ attr_id: Number(info.lastInsertRowid), op: 'add', old_value: null,
              new_value: op.value, reason: op.reason ?? null, source_turn_id: ctx.source_turn_id ?? null });
          }
          applied++;
        } else if (op.op === 'update') {
          const row = ownedActive(d, ctx, op.target_id);
          if (!row) { rejected++; continue; }
          setVal.run({ id: row.id, value: op.value, confidence: op.confidence ?? row.confidence,
            category: op.category ?? null, source_turn_id: ctx.source_turn_id ?? null });
          addHist.run({ attr_id: row.id, op: 'update', old_value: row.value, new_value: op.value,
            reason: op.reason ?? null, source_turn_id: ctx.source_turn_id ?? null });
          applied++;
        } else if (op.op === 'delete') {
          const row = ownedActive(d, ctx, op.target_id);
          if (!row) { rejected++; continue; }
          softDel.run({ id: row.id });
          addHist.run({ attr_id: row.id, op: 'delete', old_value: row.value, new_value: null,
            reason: op.reason ?? null, source_turn_id: ctx.source_turn_id ?? null });
          applied++;
        } else { rejected++; }
      } catch (e) {
        console.warn('[029-E-learn] op failed:', op?.op, e?.message ?? e);
        rejected++;
      }
    }
    return { applied, rejected };
  });
  return run(ops);
}

export function getHistory(attrId) {
  try {
    return getDb().prepare(
      `SELECT id, attr_id, op, old_value, new_value, reason, source_turn_id, created_at
       FROM persona_attribute_history WHERE attr_id=? ORDER BY id ASC`,
    ).all(attrId);
  } catch (err) {
    console.warn('[029-E-learn] getHistory failed:', err?.message ?? err);
    return [];
  }
}

export function getAttrsFor({ persona_slug, level, user_label = null }) {
  try {
    const d = getDb();
    if (level === 'l2') {
      return d.prepare(
        `SELECT id, category, key, value, confidence, status, user_label, source_turn_id, updated_at
         FROM persona_attributes
         WHERE persona_slug=? AND level='l2' AND status='active' AND user_label IS ?
         ORDER BY category, key`,
      ).all(persona_slug, user_label);
    }
    return d.prepare(
      `SELECT id, category, key, value, confidence, status, user_label, source_turn_id, updated_at
       FROM persona_attributes
       WHERE persona_slug=? AND level='l1' AND status='active'
       ORDER BY category, key`,
    ).all(persona_slug);
  } catch (err) {
    console.warn('[029-E-learn] getAttrsFor failed:', err?.message ?? err);
    return [];
  }
}
