-- 유저 단위 신고/차단 — clone_reports/clone_blocks 와 동일 패턴.
-- user_reports: 신고 내역(어드민이 조회). UNIQUE(reporter, target) — 같은 신고자가
--   같은 대상을 여러 번 신고해도 1건만.
-- user_blocks:  본인 차단 목록. UNIQUE(blocker, blocked). 클라가 list 에서 필터.

CREATE TABLE user_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK(status IN ('open','reviewed','dismissed','actioned')),
  reviewed_at TIMESTAMP,
  reviewer_admin_id INTEGER,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reporter_id, target_id)
);
CREATE INDEX idx_user_reports_target ON user_reports(target_id, created_at DESC);
CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id, created_at DESC);
CREATE INDEX idx_user_reports_status ON user_reports(status, created_at DESC);

CREATE TABLE user_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_id)
);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
