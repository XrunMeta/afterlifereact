import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.TURNS_DB_PATH ?? path.join(__dirname, 'data', 'turns.db');

const COLUMNS = [
  'session_id', 'created_at', 'mode', 'user_text', 'llm_text',
  'llm_first_token_ms', 'llm_total_ms', 'tts_total_ms', 'tts_count',
  'mt_whisper_ms', 'mt_coord_ms', 'mt_vae_ms', 'mt_unet_ms',
  'mt_padding_ms', 'mt_ffmpeg_ms', 'mt_infer_ms',
  'e2e_ms', 'sentence_count', 'audio_bytes', 'frames_pushed',
  'wav_basename', 'mp4_basename', 'raw_json',
  'source', 'speaker_role', 'user_label', 'persona_slug', 
];

const LIST_COLUMNS = ['id', ...COLUMNS.filter((c) => c !== 'raw_json')];

let _db = null;
function getDb() {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
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

  const have = new Set(_db.prepare(`PRAGMA table_info(turns)`).all().map((r) => r.name));
  for (const c of ['source', 'speaker_role', 'user_label', 'persona_slug']) {
    if (!have.has(c)) _db.exec(`ALTER TABLE turns ADD COLUMN ${c} TEXT`);
  }
  return _db;
}

export function recordTurn(row) {
  try {
    const d = getDb();
    const stmt = d.prepare(
      `INSERT INTO turns (${COLUMNS.join(', ')}) ` +
        `VALUES (${COLUMNS.map((c) => '@' + c).join(', ')})`,
    );
    const full = {};
    for (const c of COLUMNS) full[c] = row[c] ?? null;

    if (full.created_at == null) full.created_at = new Date().toISOString();
    const info = stmt.run(full);
    return Number(info.lastInsertRowid);
  } catch (err) {
    console.warn('[monitor] recordTurn failed:', err?.message ?? err);
    return null;
  }
}

export function recentTurns({ limit = 50, sinceId = 0 } = {}) {
  try {
    const d = getDb();
    return d
      .prepare(
        `SELECT ${LIST_COLUMNS.join(', ')} FROM turns ` +
          `WHERE id > ? ORDER BY id DESC LIMIT ?`,
      )
      .all(sinceId, limit);
  } catch (err) {
    console.warn('[monitor] recentTurns failed:', err?.message ?? err);
    return [];
  }
}

export function getTurn(id) {
  try {
    const d = getDb();
    return d.prepare('SELECT * FROM turns WHERE id = ?').get(id) ?? null;
  } catch (err) {
    console.warn('[monitor] getTurn failed:', err?.message ?? err);
    return null;
  }
}
