-- 0040: clone_reports — 사용자의 페르소나 신고 기록
-- 흐름:
--   1. 사용자가 홈피드 ... 메뉴에서 [신고하기] 클릭
--   2. POST /oth-path  → 신고 row 생성 + 자동 clone_block 도 같이 (한 번에 차단)
--   3. 관리자가 GET /oth-path 로 신고 기록 조회
--
-- UNIQUE(user_id, clone_id): 한 사용자가 한 클론을 여러 번 신고해도 1건만 기록.

CREATE TABLE clone_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  reason      TEXT,           -- optional 신고 사유 (현재 UI 엔 없음, 향후 확장)
  status      TEXT NOT NULL DEFAULT 'open',  -- 'open' / 'reviewed' / 'dismissed'
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_admin_id INTEGER,
  UNIQUE(user_id, clone_id)
);

CREATE INDEX idx_clone_reports_clone ON clone_reports(clone_id, created_at DESC);
CREATE INDEX idx_clone_reports_status ON clone_reports(status, created_at DESC);
