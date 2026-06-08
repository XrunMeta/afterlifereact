-- 유저 경고(strike) + 일시 비활성화(정지) — 신고 기반 모더레이션.
-- 정책: 경고 1·2회는 주의(기록만), 3회째 도달 시 계정 1개월 비활성화.
--   비활성화 = 구경/로그인은 가능하지만 페르소나 생성 차단 (suspended_until 기한까지).
--   suspended_until 은 기한 경과 시 자연 만료 (별도 cron 불필요 — 생성 게이트에서 비교).

CREATE TABLE user_warnings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id    INTEGER,            -- 발급 어드민 (xrun-admin 브릿지는 0)
  report_id   INTEGER,            -- 연결된 신고 (nullable) — user_reports.id
  reason      TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_warnings_user ON user_warnings(user_id, created_at DESC);

-- 페르소나 생성 차단 기한. NULL = 정상. 미래 시각이면 생성 차단(구경은 허용).
ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP;
