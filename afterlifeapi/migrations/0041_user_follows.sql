-- 0040: user-to-user follow (팔로워 / 팔로잉)
-- 기존 clone_follows 와 별도. users.id ↔ users.id 관계.
-- 카운트는 트리거로 user_stats 에 동기화 (clone_stats 패턴과 동일).
--
-- API:
--   POST /oth-path      — 팔로우 (멱등)
--   DELETE /oth-path      — 언팔로우
--   GET /oth-path             — 공개 프로필 (counts + 본인 follow 상태 + 페르소나 목록)
--   GET /oth-path   — 팔로워 목록
--   GET /oth-path   — 팔로잉 목록

CREATE TABLE user_follows (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, followee_id),
  -- 자기 자신 팔로우 방지.
  CHECK (follower_id <> followee_id)
);

CREATE INDEX idx_user_follows_followee ON user_follows(followee_id, created_at DESC);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id, created_at DESC);

-- user_stats: per-user 누계 카운트 (followers/following).
-- clone_stats 와 같은 패턴 — 앱에서 counter bookkeeping 안 함.
CREATE TABLE user_stats (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  followers_count  INTEGER NOT NULL DEFAULT 0,
  following_count  INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INSERT 시: followee 의 followers_count++, follower 의 following_count++.
CREATE TRIGGER trg_user_follows_inc
AFTER INSERT ON user_follows
BEGIN
  INSERT INTO user_stats (user_id, followers_count, following_count)
    VALUES (NEW.followee_id, 1, 0)
    ON CONFLICT(user_id) DO UPDATE SET
      followers_count = followers_count + 1,
      updated_at = CURRENT_TIMESTAMP;
  INSERT INTO user_stats (user_id, followers_count, following_count)
    VALUES (NEW.follower_id, 0, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      following_count = following_count + 1,
      updated_at = CURRENT_TIMESTAMP;
END;

-- DELETE 시: 양쪽 카운트 감소 (0 미만 방지).
CREATE TRIGGER trg_user_follows_dec
AFTER DELETE ON user_follows
BEGIN
  UPDATE user_stats SET
    followers_count = MAX(followers_count - 1, 0),
    updated_at = CURRENT_TIMESTAMP
    WHERE user_id = OLD.followee_id;
  UPDATE user_stats SET
    following_count = MAX(following_count - 1, 0),
    updated_at = CURRENT_TIMESTAMP
    WHERE user_id = OLD.follower_id;
END;
