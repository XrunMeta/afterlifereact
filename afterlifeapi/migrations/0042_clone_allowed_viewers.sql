-- 0042: clone_allowed_viewers — '특정 친구' 공개범위 지원.
-- 흐름:
--   1. 사용자가 페르소나 공개범위를 'selected' 로 설정 + 허용할 user id 리스트 제공
--   2. PATCH /oth-path { visibility: "selected", allowedViewers: [u1, u2, ...] }
--   3. backend 가 clone_allowed_viewers 테이블 갱신 (기존 모두 삭제 후 새로 INSERT)
--   4. discover / clone visibility 게이트:
--      - visibility=selected → owner 또는 clone_allowed_viewers 에 등록된 user 만 접근

CREATE TABLE clone_allowed_viewers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id   INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(clone_id, user_id)
);

CREATE INDEX idx_clone_allowed_viewers_clone ON clone_allowed_viewers(clone_id);
CREATE INDEX idx_clone_allowed_viewers_user ON clone_allowed_viewers(user_id);
