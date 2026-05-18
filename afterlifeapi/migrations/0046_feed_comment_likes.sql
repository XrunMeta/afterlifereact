-- feed_comment_likes — 피드 댓글 좋아요 (user × comment UNIQUE).
-- feed_comments.likes_count 컬럼 추가 + 트리거로 동기화.

ALTER TABLE feed_comments ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE feed_comment_likes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id  INTEGER NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_feed_comment_likes_comment ON feed_comment_likes(comment_id);
CREATE INDEX idx_feed_comment_likes_user ON feed_comment_likes(user_id);

CREATE TRIGGER trg_feed_comment_likes_inc
AFTER INSERT ON feed_comment_likes
BEGIN
  UPDATE feed_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
END;

CREATE TRIGGER trg_feed_comment_likes_dec
AFTER DELETE ON feed_comment_likes
BEGIN
  UPDATE feed_comments SET likes_count = MAX(0, likes_count - 1) WHERE id = OLD.comment_id;
END;
