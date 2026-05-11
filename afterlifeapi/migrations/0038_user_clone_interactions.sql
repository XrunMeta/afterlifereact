-- user_clone_interactions — per-(user, clone) 상호작용 누적치.
-- 기획서 (i18n interactionDesc) 정의:
--   "페르소나와 나눈 대화, 통화, 학습 활동의 총 횟수"
-- 친밀도(°C) = derived from total = min(100, floor(total / N))
-- N 은 백엔드 정책 (현재 50 → 100 회로 만점) — 추후 조정 가능.

CREATE TABLE user_clone_interactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  chat_count  INTEGER NOT NULL DEFAULT 0,  -- 채팅 대화
  call_count  INTEGER NOT NULL DEFAULT 0,  -- 음성/영상 통화 (call_logs 신설 시 활성)
  learn_count INTEGER NOT NULL DEFAULT 0,  -- 학습 세션 (training_sessions 신설 시 활성)
  feed_count  INTEGER NOT NULL DEFAULT 0,  -- 좋아요 + 댓글 합산
  last_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clone_id)
);

CREATE INDEX idx_uci_user ON user_clone_interactions(user_id);
CREATE INDEX idx_uci_clone ON user_clone_interactions(clone_id);
