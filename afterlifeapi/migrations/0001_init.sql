-- AfterLife DB Schema v1
-- Cloudflare D1 (SQLite)

-- 사용자
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK(gender IN ('male', 'female', 'other')),
  age INTEGER,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 사용자 관심사
CREATE TABLE user_interests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  PRIMARY KEY (user_id, interest)
);

-- AI 클론
CREATE TABLE clones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  cover_image_url TEXT,
  type TEXT NOT NULL CHECK(type IN ('멤로우', '친구', '멘토', '셀럽')),
  category TEXT,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private', 'followers')),
  learning_progress INTEGER DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 클론 관심사
CREATE TABLE clone_interests (
  clone_id TEXT NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  PRIMARY KEY (clone_id, interest)
);

-- 피드
CREATE TABLE feeds (
  id TEXT PRIMARY KEY,
  clone_id TEXT NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  image_url TEXT,
  title TEXT,
  description TEXT,
  main_category TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 채팅 메시지
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  clone_id TEXT NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'clone')),
  text TEXT NOT NULL,
  input_type TEXT DEFAULT 'text' CHECK(input_type IN ('text', 'voice')),
  audio_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_clone_user ON messages(clone_id, user_id);

-- 선물 아이템
CREATE TABLE gifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price INTEGER NOT NULL
);

-- 팔로잉 (사용자가 공개 클론을 자발적 팔로우)
CREATE TABLE follows (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id TEXT NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, clone_id)
);

-- 클론 공유 (소유자가 특정 사용자에게 비공개 클론 접근 부여)
CREATE TABLE clone_shares (
  clone_id TEXT NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  shared_to TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (clone_id, shared_to)
);
