-- feed_comments — 피드 댓글.
-- 향후 feeds.comments_count 로 카운트 캐시 추가 가능 (현재는 SUM 쿼리).

CREATE TABLE feed_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id     INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feed_comments_feed ON feed_comments(feed_id);
CREATE INDEX idx_feed_comments_user ON feed_comments(user_id);
