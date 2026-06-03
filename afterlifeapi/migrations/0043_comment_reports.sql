-- 0043: comment_reports — 댓글 신고 기록.
-- 흐름:
--   1. 사용자가 홈피드 / CloneFeed 댓글 시트에서 댓글 옆 신고 아이콘 클릭
--   2. ReportReasonModal 로 사유 입력 (선택)
--   3. POST /oth-path → row 생성
--   4. 관리자가 xrun-admin 또는 afterlife-admin 에서 조회
--
-- UNIQUE(user_id, comment_id) — 한 사용자가 같은 댓글 여러 번 신고해도 1건만 기록.

CREATE TABLE comment_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id  INTEGER NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  -- 추적용: 댓글이 cascade 로 사라져도 어떤 페르소나/feed 인지 알 수 있게 join 외에 snapshot.
  feed_id     INTEGER NOT NULL,
  clone_id    INTEGER NOT NULL,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_admin_id INTEGER,
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_reports_clone ON comment_reports(clone_id, created_at DESC);
CREATE INDEX idx_comment_reports_status ON comment_reports(status, created_at DESC);
