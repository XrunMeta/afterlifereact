-- 0092: clone_type CHECK 에 'expert' 추가 (T-152 전문가 클론 타입).
--
-- D1 (SQLite) 는 CHECK constraint 직접 변경 불가. 0044 패턴을 따라 12-step
-- 테이블 재생성. 컬럼 정의는 0091 시점 실스키마 덤프 기준
-- (.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite 에서
--  `SELECT sql FROM sqlite_master WHERE name='clones'` 로 확인, 수기 복원 아님).
-- 인덱스/트리거도 CASCADE 로 안 따라오므로 같이 재생성.
--
-- 적용:
--   wrangler d1 execute afterlife-db-preview --remote --file=migrations/0092_clone_type_expert.sql

PRAGMA foreign_keys=OFF;

-- 1) 새 테이블 (CHECK 에 'expert' 포함, 그 외 원본 그대로).
CREATE TABLE clones_new (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name               TEXT NOT NULL,
  username           TEXT UNIQUE NOT NULL,
  description        TEXT,
  clone_type         TEXT NOT NULL CHECK (clone_type IN ('memlow','friend','mentor','celeb','expert')),
  category           TEXT,
  visibility         TEXT NOT NULL DEFAULT 'public'
                     CHECK (visibility IN ('public','private','followers','selected')),
  avatar_url         TEXT,
  cover_image_url    TEXT,
  voice_type         TEXT CHECK (voice_type IN ('uploaded','preset','text_only')),
  voice_preset_id    INTEGER REFERENCES voice_presets(id) ON DELETE SET NULL,
  training_status    TEXT NOT NULL DEFAULT 'pending'
                     CHECK (training_status IN ('pending','processing','ready')),
  deleted_at         TIMESTAMP,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ownership_state    TEXT NOT NULL DEFAULT 'active'
                     CHECK (ownership_state IN ('active','archived_merged','pending_reclaim')),
  parent_clone_ids   TEXT,
  merge_source_archived_at TIMESTAMP,
  l1_profile         TEXT,
  l2_profile         TEXT,
  deletion_state     TEXT NOT NULL DEFAULT 'active'
                     CHECK (deletion_state IN ('active','soft_deleted','archived_cold','hard_deleted')),
  soft_deleted_at    TIMESTAMP,
  archived_cold_at   TIMESTAMP,
  last_coowner_reminder_at TIMESTAMP,
  coowner_reminder_opt_out INTEGER NOT NULL DEFAULT 0,
  primary_editor_user_id INTEGER REFERENCES users(id),
  is_system          INTEGER NOT NULL DEFAULT 0,
  relation           TEXT,
  idle_video_url     TEXT,
  voice_se_url       TEXT,
  owner_cascade_deleted_at TIMESTAMP,
  filler_video_urls  TEXT,
  guide_video_urls   TEXT
);

-- 2) 데이터 복사. 컬럼 순서 명시 (default 값 변동 방지).
INSERT INTO clones_new (
  id, owner_id, name, username, description, clone_type, category, visibility,
  avatar_url, cover_image_url, voice_type, voice_preset_id, training_status,
  deleted_at, created_at, updated_at,
  ownership_state, parent_clone_ids, merge_source_archived_at,
  l1_profile, l2_profile,
  deletion_state, soft_deleted_at, archived_cold_at,
  last_coowner_reminder_at, coowner_reminder_opt_out, primary_editor_user_id,
  is_system, relation, idle_video_url, voice_se_url, owner_cascade_deleted_at,
  filler_video_urls, guide_video_urls
)
SELECT
  id, owner_id, name, username, description, clone_type, category, visibility,
  avatar_url, cover_image_url, voice_type, voice_preset_id, training_status,
  deleted_at, created_at, updated_at,
  ownership_state, parent_clone_ids, merge_source_archived_at,
  l1_profile, l2_profile,
  deletion_state, soft_deleted_at, archived_cold_at,
  last_coowner_reminder_at, coowner_reminder_opt_out, primary_editor_user_id,
  is_system, relation, idle_video_url, voice_se_url, owner_cascade_deleted_at,
  filler_video_urls, guide_video_urls
FROM clones;

-- 3) 기존 테이블 삭제.
DROP TABLE clones;

-- 4) 새 테이블 rename.
ALTER TABLE clones_new RENAME TO clones;

-- 5) 인덱스 재생성 (0091 시점 실스키마 덤프 기준 6개).
CREATE INDEX idx_clones_ownership_state ON clones(ownership_state, owner_id);

CREATE INDEX idx_clones_deletion_state ON clones(deletion_state, soft_deleted_at)
  WHERE deletion_state IN ('soft_deleted','archived_cold');

CREATE INDEX idx_clones_coowner_reminder
  ON clones(last_coowner_reminder_at, coowner_reminder_opt_out)
  WHERE clone_type = 'memlow' AND coowner_reminder_opt_out = 0;

CREATE INDEX idx_clones_primary_editor_user_id ON clones(primary_editor_user_id);

CREATE INDEX idx_clones_owner_active
  ON clones(owner_id)
  WHERE deletion_state = 'active' AND deleted_at IS NULL;

CREATE INDEX idx_clones_owner_cascade
  ON clones(owner_id, owner_cascade_deleted_at)
  WHERE owner_cascade_deleted_at IS NOT NULL;

PRAGMA foreign_keys=ON;
