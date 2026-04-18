-- M-2: clone follow relation + followers_count auto-sync
-- PRD §5, api-plan §3.3 (POST/DELETE /oth-path).

CREATE TABLE clone_follows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clone_id)
);

CREATE INDEX idx_clone_follows_clone ON clone_follows(clone_id, created_at DESC);
CREATE INDEX idx_clone_follows_user  ON clone_follows(user_id, created_at DESC);

-- Keep clone_stats.followers_count in sync without app-level counter bookkeeping.
CREATE TRIGGER trg_clone_follows_inc
AFTER INSERT ON clone_follows
BEGIN
  INSERT INTO clone_stats (clone_id, followers_count)
    VALUES (NEW.clone_id, 1)
    ON CONFLICT(clone_id) DO UPDATE SET followers_count = followers_count + 1;
END;

CREATE TRIGGER trg_clone_follows_dec
AFTER DELETE ON clone_follows
BEGIN
  UPDATE clone_stats SET followers_count = MAX(followers_count - 1, 0)
    WHERE clone_id = OLD.clone_id;
END;
