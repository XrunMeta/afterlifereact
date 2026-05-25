import v_84e389 from 'xvkzfbaklmaecz';
import v_9fe22d from 'wiosxndes';
import v_9d3c52 from 'hbppvrg';
import { v_6b8a99 } from 'bujvoezm';

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url)); 
const v_8e761b =
  process.env.LEARNING_DB_PATH ?? v_9fe22d.join(v_a65c2e, '..', 'data', 'learning.db');

export const v_6e79a1 = ['profile', 'preference', 'health', 'relationship', 'episode', 'misc'];

let v_94ad75 = null;
function v_602bcd() {
  if (v_94ad75) return v_94ad75;
  v_9d3c52.mkdirSync(v_9fe22d.dirname(v_8e761b), { recursive: true });
  v_94ad75 = new v_84e389(v_8e761b);
  v_94ad75.pragma('journal_mode = WAL');
  v_94ad75.exec(`
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
  return v_94ad75;
}

export function v_ff48df({ persona_slug: v_bb0b45, level: v_fbe91e, user_label: v_5f6f0b = null }) {
  try {
    const v_d5dda0 = v_602bcd();
    if (v_fbe91e === 'l2') {
      return v_d5dda0.prepare(
        `SELECT id, category, key, value, confidence, status, user_label, source_turn_id, updated_at
         FROM persona_attributes
         WHERE persona_slug=? AND level='l2' AND status='active' AND user_label IS ?
         ORDER BY category, key`,
      ).all(v_bb0b45, v_5f6f0b);
    }
    return v_d5dda0.prepare(
      `SELECT id, category, key, value, confidence, status, user_label, source_turn_id, updated_at
       FROM persona_attributes
       WHERE persona_slug=? AND level='l1' AND status='active'
       ORDER BY category, key`,
    ).all(v_bb0b45);
  } catch (v_49263d) {
    console.warn('[029-E-learn] getAttrsFor failed:', v_49263d?.message ?? v_49263d);
    return [];
  }
}
