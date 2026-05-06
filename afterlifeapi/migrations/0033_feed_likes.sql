-- feed_likes — 피드 좋아요 (user × feed UNIQUE).
-- feeds.likes_count 는 트리거로 동기화.

CREATE TABLE feed_likes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id     INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(feed_id, user_id)
);

CREATE INDEX idx_feed_likes_feed ON feed_likes(feed_id);
CREATE INDEX idx_feed_likes_user ON feed_likes(user_id);

-- 카운트 동기화 트리거.
CREATE TRIGGER trg_feed_likes_inc
AFTER INSERT ON feed_likes
BEGIN
  UPDATE feeds SET likes_count = likes_count + 1 WHERE id = NEW.feed_id;
END;

CREATE TRIGGER trg_feed_likes_dec
AFTER DELETE ON feed_likes
BEGIN
  UPDATE feeds SET likes_count = MAX(0, likes_count - 1) WHERE id = OLD.feed_id;
END;
