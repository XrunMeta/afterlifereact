-- 사용자가 업로드한 모든 이미지/파일을 관리하는 단일 테이블.
-- R2 객체는 buckets/afterlife-archive-* 의 uploadedfiles/{r2_key} 에 저장됨.
-- owner_user_id는 users(id)와 연결 — 유저 삭제 시 SET NULL로 객체는 보존(별도 GC).

CREATE TABLE files (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key          TEXT NOT NULL UNIQUE,
  content_type    TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  owner_user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  purpose         TEXT,                                  -- 'avatar' | 'message' | 'clone_thumb' | …
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_owner   ON files(owner_user_id);
CREATE INDEX idx_files_purpose ON files(purpose);
