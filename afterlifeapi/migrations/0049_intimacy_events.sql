-- intimacy_events — 친밀도 점수 적립 이벤트 로그.
-- 페르소나 owner 가 "누가 / 언제 / 어떤 액션으로 / 몇 점" 받았는지 조회 가능.
-- 점수가 실제로 적용된 (applied > 0) 경우만 기록 — 쿨다운/Daily Cap 으로 0 인 케이스 제외.
--
-- 기획서: docs/specs/2026-05-15-intimacy-system.md

CREATE TABLE intimacy_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  action      TEXT NOT NULL
                CHECK(action IN ('chat','call','learn','feed')),
  score       INTEGER NOT NULL,    -- 실제 적용된 점수 (1~15, Daily Cap 적용 후 값)
  feed_id     INTEGER REFERENCES feeds(id) ON DELETE SET NULL,  -- feed 액션일 때만
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- owner 가 자기 페르소나 이벤트 목록 조회 (최신순)
CREATE INDEX idx_intimacy_events_clone ON intimacy_events(clone_id, created_at DESC);
-- viewer 가 자기가 적립한 이벤트 (디버그/유저 페이지)
CREATE INDEX idx_intimacy_events_user ON intimacy_events(user_id, created_at DESC);
