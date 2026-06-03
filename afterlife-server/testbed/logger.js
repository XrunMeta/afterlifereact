import v_84e389 from 'xvkzfbaklmaecz';
import v_9fe22d from 'wiosxndes';
import v_9d3c52 from 'hbppvrg';
import { v_6b8a99 } from 'bujvoezm';

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));
const v_8e761b =
  process.env.TURNS_DB_PATH ?? v_9fe22d.join(v_a65c2e, 'data', 'turns.db');

const v_af189e = [
  'session_id', 'created_at', 'mode', 'user_text', 'llm_text',
  'llm_first_token_ms', 'llm_total_ms', 'tts_total_ms', 'tts_count',
  'mt_whisper_ms', 'mt_coord_ms', 'mt_vae_ms', 'mt_unet_ms',
  'mt_padding_ms', 'mt_ffmpeg_ms', 'mt_infer_ms',
  'e2e_ms', 'sentence_count', 'audio_bytes', 'frames_pushed',
  'wav_basename', 'mp4_basename', 'raw_json',
  'source', 'speaker_role', 'user_label', 'persona_slug', 
];

const v_40b39c = ['id', ...v_af189e.filter((v_3f4e2e) => v_3f4e2e !== 'raw_json')];

let v_94ad75 = null;
function v_602bcd() {
  if (v_94ad75) return v_94ad75;
  v_9d3c52.mkdirSync(v_9fe22d.dirname(v_8e761b), { recursive: true });
  v_94ad75 = new v_84e389(v_8e761b);
  v_94ad75.pragma('journal_mode = WAL');
  v_94ad75.exec(`
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT, created_at TEXT, mode TEXT,
      user_text TEXT, llm_text TEXT,
      llm_first_token_ms INTEGER, llm_total_ms INTEGER,
      tts_total_ms INTEGER, tts_count INTEGER,
      mt_whisper_ms INTEGER, mt_coord_ms INTEGER, mt_vae_ms INTEGER,
      mt_unet_ms INTEGER, mt_padding_ms INTEGER, mt_ffmpeg_ms INTEGER,
      mt_infer_ms INTEGER, e2e_ms INTEGER,
      sentence_count INTEGER, audio_bytes INTEGER, frames_pushed INTEGER,
      wav_basename TEXT, mp4_basename TEXT, raw_json TEXT,
      source TEXT, speaker_role TEXT, user_label TEXT, persona_slug TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_turns_id_desc ON turns(id DESC);
  `);

  const v_4173e3 = new Set(v_94ad75.prepare(`PRAGMA table_info(turns)`).all().map((v_cb35cb) => v_cb35cb.name));
  for (const v_3f4e2e of ['source', 'speaker_role', 'user_label', 'persona_slug']) {
    if (!v_4173e3.has(v_3f4e2e)) v_94ad75.exec(`ALTER TABLE turns ADD COLUMN ${v_3f4e2e} TEXT`);
  }
  return v_94ad75;
}

export function v_e173d2(v_3ac7e7) {
  try {
    const v_d5dda0 = v_602bcd();
    const v_df04a4 = v_d5dda0.prepare(
      `INSERT INTO turns (${v_af189e.join(', ')}) ` +
        `VALUES (${v_af189e.map((v_3f4e2e) => '@' + v_3f4e2e).join(', ')})`,
    );
    const v_e13cd0 = {};
    for (const v_3f4e2e of v_af189e) v_e13cd0[v_3f4e2e] = v_3ac7e7[v_3f4e2e] ?? null;

    if (v_e13cd0.created_at == null) v_e13cd0.created_at = new Date().toISOString();
    const v_34d5e3 = v_df04a4.run(v_e13cd0);
    return Number(v_34d5e3.lastInsertRowid);
  } catch (v_49263d) {
    console.warn('[monitor] recordTurn failed:', v_49263d?.message ?? v_49263d);
    return null;
  }
}

export function v_483137({ limit: v_02be30 = 50, sinceId: v_a35e1b = 0 } = {}) {
  try {
    const v_d5dda0 = v_602bcd();
    return v_d5dda0
      .prepare(
        `SELECT ${v_40b39c.join(', ')} FROM turns ` +
          `WHERE id > ? ORDER BY id DESC LIMIT ?`,
      )
      .all(v_a35e1b, v_02be30);
  } catch (v_49263d) {
    console.warn('[monitor] recentTurns failed:', v_49263d?.message ?? v_49263d);
    return [];
  }
}

export function v_f456fa(v_389afb) {
  try {
    const v_d5dda0 = v_602bcd();
    return v_d5dda0.prepare('SELECT * FROM turns WHERE id = ?').get(v_389afb) ?? null;
  } catch (v_49263d) {
    console.warn('[monitor] getTurn failed:', v_49263d?.message ?? v_49263d);
    return null;
  }
}
