-- Activity logs & Clone stats

-- 운영 로그 (사용자 행동 추적)
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id TEXT REFERENCES clones(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata TEXT,
  ip TEXT,
  device TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at);
CREATE INDEX idx_activity_clone ON activity_logs(clone_id, action);
CREATE INDEX idx_activity_action ON activity_logs(action, created_at);

-- 클론 통계 집계
CREATE TABLE clone_stats (
  clone_id TEXT PRIMARY KEY REFERENCES clones(id) ON DELETE CASCADE,
  total_chats INTEGER DEFAULT 0,
  total_chat_duration INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  total_call_duration INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  total_feeds INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 기존 클론에 대한 초기 stats 레코드 생성
INSERT INTO clone_stats (clone_id) SELECT id FROM clones;
