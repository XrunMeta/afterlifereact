import v_84e389 from 'xvkzfbaklmaecz';

const v_22d422 = ['starting', 'live', 'ending'];

export function v_64a9a8(v_a00264) {
  const v_a1651b = new v_84e389(v_a00264);
  v_a1651b.pragma('journal_mode = WAL');
  v_a1651b.exec(`
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
  return v_a1651b;
}

export function v_56ab22(v_a1651b, { callId: v_be62d3, cloneId: v_6e0fd3, userId: v_43e90c, port: v_f31c63, trackVideo: v_c04e9b, trackAudio: v_1a8cc4, idleVideo: v_254c18, subscribeToken: v_dc1777, now: v_5c2f9f }) {
  v_a1651b.prepare(`
    INSERT INTO calls (call_id, clone_id, user_id, port, track_video, track_audio, idle_video, subscribe_token, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'starting', ?)
  `).run(v_be62d3, v_6e0fd3, v_43e90c, v_f31c63, v_c04e9b, v_1a8cc4, v_254c18, v_dc1777, v_5c2f9f);
}

export function v_a2bce1(v_a1651b, v_be62d3, v_d4923e) {
  v_a1651b.prepare(`UPDATE calls SET pid = ? WHERE call_id = ?`).run(v_d4923e, v_be62d3);
}

export function v_bbc8a8(v_a1651b, v_be62d3, v_b6e533, v_58ca36 = null) {
  v_a1651b.prepare(`UPDATE calls SET state = ?, reason = COALESCE(?, reason) WHERE call_id = ?`).run(v_b6e533, v_58ca36, v_be62d3);
}

export function v_ac99e0(v_a1651b, v_be62d3) {
  return v_a1651b.prepare(`SELECT * FROM calls WHERE call_id = ?`).get(v_be62d3) ?? null;
}

export function v_114365(v_a1651b) {
  const v_e3bf0b = v_22d422.map(() => '?').join(',');
  return v_a1651b.prepare(`SELECT * FROM calls WHERE state IN (${v_e3bf0b}) ORDER BY created_at`).all(...v_22d422);
}

export function v_907127(v_a1651b) {
  return v_114365(v_a1651b).map(v_cb35cb => v_cb35cb.port);
}

export function v_51c671(v_a1651b, v_be62d3, v_58ca36, v_5c2f9f) {
  v_a1651b.prepare(`UPDATE calls SET state = 'ended', reason = ?, ended_at = ? WHERE call_id = ?`).run(v_58ca36, v_5c2f9f, v_be62d3);
}
