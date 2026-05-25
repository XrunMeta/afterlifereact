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

function v_cd3306(v_d5dda0, v_16e2dd, v_b24339) {
  if (v_16e2dd.level === 'l2') {
    return v_d5dda0.prepare(
      `SELECT * FROM persona_attributes
       WHERE persona_slug=? AND level='l2' AND status='active' AND user_label IS ? AND key=?`,
    ).get(v_16e2dd.persona_slug, v_16e2dd.user_label ?? null, v_b24339);
  }
  return v_d5dda0.prepare(
    `SELECT * FROM persona_attributes
     WHERE persona_slug=? AND level='l1' AND status='active' AND key=?`,
  ).get(v_16e2dd.persona_slug, v_b24339);
}

function v_7f2f8b(v_d5dda0, v_16e2dd, v_389afb) {
  const v_3ac7e7 = v_d5dda0.prepare(`SELECT * FROM persona_attributes WHERE id=? AND status='active'`).get(v_389afb);
  if (!v_3ac7e7) return null;
  if (v_3ac7e7.persona_slug !== v_16e2dd.persona_slug || v_3ac7e7.level !== v_16e2dd.level) return null;
  if (v_16e2dd.level === 'l2' && (v_3ac7e7.user_label ?? null) !== (v_16e2dd.user_label ?? null)) return null;
  return v_3ac7e7;
}

export function v_3ad6c0(v_16e2dd, v_152909) {
  if (!Array.isArray(v_152909) || v_152909.length === 0) return { applied: 0, rejected: 0 };
  const v_d5dda0 = v_602bcd();
  const v_5c2f9f = `datetime('now')`;
  const v_d70f86 = v_d5dda0.prepare(
    `INSERT INTO persona_attributes
       (clone_id, persona_slug, level, key, value, category, confidence, user_ref, user_label, source_turn_id)
     VALUES (NULL, @persona_slug, @level, @key, @value, @category, @confidence, NULL, @user_label, @source_turn_id)`,
  );
  const v_3a3e6d = v_d5dda0.prepare(
    `UPDATE persona_attributes SET value=@value, confidence=@confidence,
       category=COALESCE(@category, category), source_turn_id=@source_turn_id, updated_at=${v_5c2f9f} WHERE id=@id`,
  );
  const v_794b1e = v_d5dda0.prepare(`UPDATE persona_attributes SET status='deleted', updated_at=${v_5c2f9f} WHERE id=@id`);
  const v_96f472 = v_d5dda0.prepare(
    `INSERT INTO persona_attribute_history (attr_id, op, old_value, new_value, reason, source_turn_id)
     VALUES (@attr_id, @op, @old_value, @new_value, @reason, @source_turn_id)`,
  );

  const v_d9b231 = v_d5dda0.transaction((v_b91af0) => {
    let v_cdef5f = 0, v_aa3da3 = 0;
    for (const v_f96a98 of v_b91af0) {
      try {
        if (v_f96a98.op === 'add') {
          const v_3c8572 = v_cd3306(v_d5dda0, v_16e2dd, v_f96a98.key);
          if (v_3c8572) {
            v_3a3e6d.run({ id: v_3c8572.id, value: v_f96a98.value, confidence: v_f96a98.confidence ?? v_3c8572.confidence,
              category: v_f96a98.category ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
            v_96f472.run({ attr_id: v_3c8572.id, op: 'update', old_value: v_3c8572.value,
              new_value: v_f96a98.value, reason: v_f96a98.reason ?? 'add→update(중복)', source_turn_id: v_16e2dd.source_turn_id ?? null });
          } else {
            const v_34d5e3 = v_d70f86.run({ persona_slug: v_16e2dd.persona_slug, level: v_16e2dd.level, key: v_f96a98.key,
              value: v_f96a98.value, category: v_f96a98.category ?? 'misc', confidence: v_f96a98.confidence ?? null,
              user_label: v_16e2dd.user_label ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
            v_96f472.run({ attr_id: Number(v_34d5e3.lastInsertRowid), op: 'add', old_value: null,
              new_value: v_f96a98.value, reason: v_f96a98.reason ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
          }
          v_cdef5f++;
        } else if (v_f96a98.op === 'update') {
          const v_3ac7e7 = v_7f2f8b(v_d5dda0, v_16e2dd, v_f96a98.target_id);
          if (!v_3ac7e7) { v_aa3da3++; continue; }
          v_3a3e6d.run({ id: v_3ac7e7.id, value: v_f96a98.value, confidence: v_f96a98.confidence ?? v_3ac7e7.confidence,
            category: v_f96a98.category ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
          v_96f472.run({ attr_id: v_3ac7e7.id, op: 'update', old_value: v_3ac7e7.value, new_value: v_f96a98.value,
            reason: v_f96a98.reason ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
          v_cdef5f++;
        } else if (v_f96a98.op === 'delete') {
          const v_3ac7e7 = v_7f2f8b(v_d5dda0, v_16e2dd, v_f96a98.target_id);
          if (!v_3ac7e7) { v_aa3da3++; continue; }
          v_794b1e.run({ id: v_3ac7e7.id });
          v_96f472.run({ attr_id: v_3ac7e7.id, op: 'delete', old_value: v_3ac7e7.value, new_value: null,
            reason: v_f96a98.reason ?? null, source_turn_id: v_16e2dd.source_turn_id ?? null });
          v_cdef5f++;
        } else { v_aa3da3++; }
      } catch (v_9e86fd) {
        console.warn('[029-E-learn] op failed:', v_f96a98?.op, v_9e86fd?.message ?? v_9e86fd);
        v_aa3da3++;
      }
    }
    return { applied: v_cdef5f, rejected: v_aa3da3 };
  });
  return v_d9b231(v_152909);
}

export function v_49715e(v_3d3c70) {
  try {
    return v_602bcd().prepare(
      `SELECT id, attr_id, op, old_value, new_value, reason, source_turn_id, created_at
       FROM persona_attribute_history WHERE attr_id=? ORDER BY id ASC`,
    ).all(v_3d3c70);
  } catch (v_49263d) {
    console.warn('[029-E-learn] getHistory failed:', v_49263d?.message ?? v_49263d);
    return [];
  }
}

export function v_e9fc79({ persona_slug: v_bb0b45, level: v_fbe91e = null, user_label: v_5f6f0b = null, limit: v_02be30 = 200 }) {
  try {
    const v_d5dda0 = v_602bcd();
    const v_abcc8d = ['persona_slug=?', "status='active'"];
    const v_4317d1 = [v_bb0b45];
    if (v_fbe91e) { v_abcc8d.push('level=?'); v_4317d1.push(v_fbe91e); }
    if (v_5f6f0b != null) { v_abcc8d.push('user_label=?'); v_4317d1.push(v_5f6f0b); }
    v_4317d1.push(v_02be30);
    return v_d5dda0.prepare(
      `SELECT id, persona_slug, level, category, key, value, confidence, user_label, source_turn_id, updated_at
       FROM persona_attributes WHERE ${v_abcc8d.join(' AND ')}
       ORDER BY updated_at DESC, id DESC LIMIT ?`,
    ).all(...v_4317d1);
  } catch (v_49263d) {
    console.warn('[029-E-learn] recentAttrs failed:', v_49263d?.message ?? v_49263d);
    return [];
  }
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
