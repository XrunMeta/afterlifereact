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
