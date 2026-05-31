-- SP2: 통화 시간·내용 기록(과금/감사 단일출처). 통화 상태(port/state)는 orchestrator 로컬 sqlite 별도.
CREATE TABLE IF NOT EXISTS call_sessions (
  call_id      TEXT PRIMARY KEY,
  user_id      INTEGER NOT NULL,
  clone_id     INTEGER NOT NULL,
  -- 실제 응답한 페르소나(SP2 = halbae 고정). clone_id 와 분리 기록 — 감사 연속성(amane).
  -- SP3 per-clone 해상도 전환 시 동적 값으로 채워짐(기존 레코드 NULL 방지).
  persona_slug TEXT,
  started_at   INTEGER NOT NULL,
  ended_at     INTEGER,
  duration_sec INTEGER
);
CREATE INDEX IF NOT EXISTS idx_call_sessions_user ON call_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_clone ON call_sessions(clone_id);

CREATE TABLE IF NOT EXISTS call_turns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id    TEXT NOT NULL,
  seq        INTEGER NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user','clone')),
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(call_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_call_turns_call ON call_turns(call_id);
