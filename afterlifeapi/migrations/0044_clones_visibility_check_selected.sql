-- 0044: clones.visibility CHECK 에 'selected' 추가.
-- 흐름:
--   원래 0001 의 CHECK (visibility IN ('public','private','followers'))
--   가 'selected' 케이스를 막아서 PATCH /oth-path visibility='selected'
--   요청이 SQLite CHECK 위반 → batch fail → 500 INTERNAL_ERROR.
--
-- D1 (SQLite) 는 CHECK constraint 직접 변경 불가. 12-step pattern 으로
-- 테이블 재생성. 인덱스/트리거도 같이 재생성 (CASCADE 로 안 따라옴).
--
-- 적용:
--   wrangler d1 execute afterlife-db-preview --remote --file=migrations/0044_clones_visibility_check_selected.sql

-- 1) 새 테이블 (CHECK 에 'selected' 포함, 그 외 원본 그대로).
CREATE TABLE clones_new (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name               TEXT NOT NULL,
  username           TEXT UNIQUE NOT NULL,
  description        TEXT,
  clone_type         TEXT NOT NULL CHECK (clone_type IN ('memlow','friend','mentor','celeb')),
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
  primary_editor_user_id INTEGER REFERENCES users(id)
);

-- 2) 데이터 복사. 컬럼 순서 명시 (default 값 변동 방지).
INSERT INTO clones_new (
  id, owner_id, name, username, description, clone_type, category, visibility,
  avatar_url, cover_image_url, voice_type, voice_preset_id, training_status,
  deleted_at, created_at, updated_at,
  ownership_state, parent_clone_ids, merge_source_archived_at,
  l1_profile, l2_profile,
  deletion_state, soft_deleted_at, archived_cold_at,
  last_coowner_reminder_at, coowner_reminder_opt_out, primary_editor_user_id
)
SELECT
  id, owner_id, name, username, description, clone_type, category, visibility,
  avatar_url, cover_image_url, voice_type, voice_preset_id, training_status,
  deleted_at, created_at, updated_at,
  ownership_state, parent_clone_ids, merge_source_archived_at,
  l1_profile, l2_profile,
  deletion_state, soft_deleted_at, archived_cold_at,
  last_coowner_reminder_at, coowner_reminder_opt_out, primary_editor_user_id
FROM clones;

-- 3) 기존 테이블 삭제.
DROP TABLE clones;

-- 4) 새 테이블 rename.
ALTER TABLE clones_new RENAME TO clones;

-- 5) 인덱스 재생성 (sqlite_master 에서 확인된 5개 외 인덱스).
CREATE INDEX idx_clones_ownership_state ON clones(ownership_state, owner_id);

CREATE INDEX idx_clones_deletion_state ON clones(deletion_state, soft_deleted_at)
  WHERE deletion_state IN ('soft_deleted','archived_cold');

CREATE INDEX idx_clones_coowner_reminder
  ON clones(last_coowner_reminder_at, coowner_reminder_opt_out)
  WHERE clone_type = 'memlow' AND coowner_reminder_opt_out = 0;

CREATE INDEX idx_clones_primary_editor_user_id ON clones(primary_editor_user_id);

CREATE UNIQUE INDEX uniq_clones_owner_type_active
  ON clones(owner_id, clone_type)
  WHERE deletion_state = 'active' AND deleted_at IS NULL;
