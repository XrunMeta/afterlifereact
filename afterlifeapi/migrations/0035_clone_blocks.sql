-- clone_blocks — 사용자가 차단한 클론.
-- 홈 디스커버에서 제외 + MyPage 차단 목록에 노출.

CREATE TABLE clone_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clone_id)
);

CREATE INDEX idx_clone_blocks_user ON clone_blocks(user_id);
