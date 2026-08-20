-- T-531K (2026-08-20): 추가 제재 컬럼 — 댓글/상호작용 금지 + 강제 로그아웃.
--   기존 users 테이블에 3개 컬럼 추가.
--   * comment_ban_until: 이 시각까지 댓글 작성 금지. 게이트는 POST /oth-path 등.
--   * interaction_ban_until: 이 시각까지 좋아요·팔로우 금지. 게이트는 like/follow endpoint.
--   * session_epoch: force-logout 카운터. rotateSession 시 payload.epoch != users.session_epoch 이면
--                    refresh 거부 → 15분 내 로그아웃 강제. 관리자가 증가시켜 세션 무효화.

ALTER TABLE users ADD COLUMN comment_ban_until TIMESTAMP;
ALTER TABLE users ADD COLUMN interaction_ban_until TIMESTAMP;
ALTER TABLE users ADD COLUMN session_epoch INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_comment_ban ON users(comment_ban_until);
CREATE INDEX IF NOT EXISTS idx_users_interaction_ban ON users(interaction_ban_until);
