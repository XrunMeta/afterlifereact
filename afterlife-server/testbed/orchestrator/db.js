import Database from 'better-sqlite3';

const ACTIVE_STATES = ['starting', 'live', 'ending'];

export function openDb(filePath) {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      call_id     TEXT PRIMARY KEY,
      clone_id    TEXT    NOT NULL,   -- SP1a: 정수 cloneId 문자열. SP3에서 cloneUuid로 교체 예정.
      user_id     TEXT    NOT NULL,
      pid         INTEGER,
      port        INTEGER NOT NULL,
      track_video TEXT    NOT NULL,
      track_audio TEXT    NOT NULL,
      idle_video  TEXT,
      subscribe_token TEXT NOT NULL,  -- 구독 경로 가드(orchestrator mint, SP1b 통합)
      state       TEXT    NOT NULL DEFAULT 'starting'
                  CHECK (state IN ('starting','live','ending','ended','failed')),
      reason      TEXT,
      created_at  INTEGER NOT NULL,
      ended_at    INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_calls_state ON calls(state);
    -- 활성 통화 간 포트 유일성 DB 레벨 방어(앱 로직 보강). ended/failed 는 제외.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_port_active
      ON calls(port) WHERE state IN ('starting','live','ending');
  `);
  return db;
}

export function insertCall(db, { callId, cloneId, userId, port, trackVideo, trackAudio, idleVideo, subscribeToken, now }) {
  db.prepare(`
    INSERT INTO calls (call_id, clone_id, user_id, port, track_video, track_audio, idle_video, subscribe_token, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'starting', ?)
  `).run(callId, cloneId, userId, port, trackVideo, trackAudio, idleVideo, subscribeToken, now);
}

export function setPid(db, callId, pid) {
  db.prepare(`UPDATE calls SET pid = ? WHERE call_id = ?`).run(pid, callId);
}

export function updateState(db, callId, state, reason = null) {
  db.prepare(`UPDATE calls SET state = ?, reason = COALESCE(?, reason) WHERE call_id = ?`).run(state, reason, callId);
}

export function getCall(db, callId) {
  return db.prepare(`SELECT * FROM calls WHERE call_id = ?`).get(callId) ?? null;
}

export function listActive(db) {
  const ph = ACTIVE_STATES.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM calls WHERE state IN (${ph}) ORDER BY created_at`).all(...ACTIVE_STATES);
}

export function activePorts(db) {
  return listActive(db).map(r => r.port);
}

export function endCall(db, callId, reason, now) {

  db.prepare(`UPDATE calls SET state = 'ended', reason = ?, ended_at = ?, subscribe_token = '' WHERE call_id = ?`).run(reason, now, callId);
}
