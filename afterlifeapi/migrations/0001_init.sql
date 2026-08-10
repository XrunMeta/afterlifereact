-- AfterLife D1 초기 스키마 (3차 개정, 2026-04-14)
-- Source of Truth: docs/PRD.md §7
-- 27 tables + triggers + indexes
-- FK enforcement: D1 은 항상 ON 이며 **끌 수 없다** (T-440 · 0083 실측).
--   런타임에서 설정하는 값이 아니다 — `PRAGMA foreign_keys=OFF` 를 써도 no-op 이고,
--   그래서 `DROP TABLE <부모>` 는 CASCADE 자식을 그대로 지운다. 재생성 마이그를 쓸 땐
--   보상 로직 필수: KB `T-440-D1테이블재생성-CASCADE파괴/README.md`.

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  phone               TEXT,
  gender              TEXT CHECK (gender IS NULL OR gender IN ('male','female','other')),
  age                 INTEGER,
  avatar_url          TEXT,
  credits             INTEGER NOT NULL DEFAULT 0,
  balance_checkpoint  INTEGER NOT NULL DEFAULT 0,
  last_ledger_id      INTEGER NOT NULL DEFAULT 0,
  checkpoint_at       TIMESTAMP,
  funnel_stage        TEXT NOT NULL DEFAULT 'explorer',
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TIMESTAMP,
  deleted_at          TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_interests (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest  TEXT NOT NULL,
  UNIQUE(user_id, interest)
);

CREATE TABLE user_devices (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id       TEXT NOT NULL,
  push_token      TEXT NOT NULL,
  platform        TEXT NOT NULL,
  is_active       INTEGER NOT NULL DEFAULT 1,
  last_active_at  TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);

-- ============================================================
-- VOICE PRESETS (referenced by clones)
-- ============================================================

CREATE TABLE voice_presets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  gender       TEXT,
  age_range    TEXT,
  sample_url   TEXT,
  description  TEXT
);

-- ============================================================
-- CLONES
-- ============================================================

CREATE TABLE clones (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name               TEXT NOT NULL,
  username           TEXT UNIQUE NOT NULL,
  description        TEXT,
  clone_type         TEXT NOT NULL CHECK (clone_type IN ('memlow','friend','mentor','celeb')),
  category           TEXT,
  visibility         TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','followers')),
  avatar_url         TEXT,
  cover_image_url    TEXT,
  voice_type         TEXT CHECK (voice_type IN ('uploaded','preset','text_only')),
  voice_preset_id    INTEGER REFERENCES voice_presets(id) ON DELETE SET NULL,
  training_status    TEXT NOT NULL DEFAULT 'pending' CHECK (training_status IN ('pending','processing','ready')),
  deleted_at         TIMESTAMP,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clone_interests (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id  INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  interest  TEXT NOT NULL
);

CREATE TABLE clone_photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  photo_type  TEXT NOT NULL CHECK (photo_type IN ('profile','memory')),
  tags_json   TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clone_stats (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id          INTEGER NOT NULL UNIQUE REFERENCES clones(id) ON DELETE CASCADE,
  followers_count   INTEGER NOT NULL DEFAULT 0,
  messages_count    INTEGER NOT NULL DEFAULT 0,
  gifts_count       INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SOCIAL (follows / shares / invites / merge)
-- ============================================================

CREATE TABLE follows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clone_id)
);

CREATE TABLE clone_shares (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id        INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  owner_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  invite_email    TEXT,
  relation        TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','owner')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invited','accepted','rejected')),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (target_user_id IS NOT NULL OR invite_email IS NOT NULL)
);

CREATE TABLE invite_tokens (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash    TEXT UNIQUE NOT NULL,
  clone_id      INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_email  TEXT,
  relation      TEXT,
  grant_owner   INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMP NOT NULL,
  used_at       TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- invite_tokens_archive: 감사용. 평문 토큰 절대 저장 금지, 해시만 이관.
CREATE TABLE invite_tokens_archive (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  original_id    INTEGER NOT NULL,
  token_hash     TEXT NOT NULL,  -- SHA-256 해시만 (평문 토큰 저장 금지)
  clone_id       INTEGER NOT NULL,
  owner_id       INTEGER NOT NULL,
  invite_email   TEXT,
  relation       TEXT,
  grant_owner    INTEGER NOT NULL DEFAULT 0,
  issued_at      TIMESTAMP NOT NULL,
  resolved_at    TIMESTAMP NOT NULL,
  resolution     TEXT NOT NULL CHECK (resolution IN ('used','expired','revoked')),
  archived_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE merge_conflicts_pending (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  new_clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field           TEXT NOT NULL,
  value_a         TEXT,
  value_b         TEXT,
  resolved_value  TEXT,
  resolved_at     TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(new_clone_id, user_id, field)  -- 린 3차: 동일 충돌 중복 기록 방지
);

CREATE TABLE clone_publicity_consents (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id               INTEGER NOT NULL REFERENCES clones(id) ON DELETE RESTRICT,
  user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_text_version   TEXT NOT NULL,
  ip                     TEXT,
  device                 TEXT,
  consented_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONTENT (feeds / messages / starred)
-- ============================================================

CREATE TABLE feeds (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id      INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  content       TEXT,
  media_url     TEXT,
  media_type    TEXT CHECK (media_type IN ('image','video','short')),
  likes_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id                INTEGER REFERENCES clones(id) ON DELETE SET NULL,
  user_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id              TEXT NOT NULL,
  role                    TEXT NOT NULL CHECK (role IN ('user','clone')),
  content                 TEXT, -- ALE ciphertext, NULL when purged
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','purged')),
  reconciliation_status   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (reconciliation_status IN ('pending','processing','completed','failed')),
  summary_verified_at     TIMESTAMP,
  reconcile_retry_count   INTEGER NOT NULL DEFAULT 0,
  purged_at               TIMESTAMP,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_starred (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id  INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, message_id)
);

-- ============================================================
-- COMMERCE (gifts / credits)
-- ============================================================

CREATE TABLE gifts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  emoji          TEXT,
  price_credits  INTEGER NOT NULL CHECK (price_credits > 0)
);

CREATE TABLE gift_transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  clone_id    INTEGER NOT NULL REFERENCES clones(id) ON DELETE RESTRICT,
  gift_id     INTEGER NOT NULL REFERENCES gifts(id) ON DELETE RESTRICT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credit_ledgers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount           INTEGER NOT NULL,
  type             TEXT NOT NULL
                    CHECK (type IN ('charge_inapp','charge_xrun','gift','clone_create','refund','admin_grant')),
  ref_id           TEXT,
  idempotency_key  TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, idempotency_key)  -- 린 3차: 결제 타입별 네임스페이스 분리
);

-- ============================================================
-- ADMIN
-- ============================================================

CREATE TABLE admin_users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  telegram_user_id     TEXT UNIQUE,
  role                 TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin','moderator')),
  is_active            INTEGER NOT NULL DEFAULT 1,
  failed_login_count   INTEGER NOT NULL DEFAULT 0,
  locked_until         TIMESTAMP,
  last_login_at        TIMESTAMP,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_totp (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id        INTEGER NOT NULL UNIQUE REFERENCES admin_users(id) ON DELETE CASCADE,
  secret_encrypted     TEXT NOT NULL,
  algorithm            TEXT NOT NULL DEFAULT 'SHA1',
  digits               INTEGER NOT NULL DEFAULT 6,
  period               INTEGER NOT NULL DEFAULT 30,
  backup_codes_hash    TEXT,
  last_used_counter    INTEGER,
  enrolled_at          TIMESTAMP,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_audit_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id   INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       TEXT,
  reason          TEXT,
  ip              TEXT,
  user_agent      TEXT,
  prev_hash       TEXT,
  chain_hash      TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NOTIFICATIONS / LOGS / ADS
-- ============================================================

CREATE TABLE notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT,
  body        TEXT,
  data_json   TEXT,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     TEXT,
  ip          TEXT,
  device      TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ad_keywords (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword         TEXT NOT NULL,
  track           TEXT NOT NULL CHECK (track IN ('general','memlow')),
  ad_title        TEXT,
  ad_url          TEXT,
  ad_description  TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE ad_impressions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_keyword_id   INTEGER NOT NULL REFERENCES ad_keywords(id) ON DELETE RESTRICT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  clone_id        INTEGER REFERENCES clones(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES (PRD §7.5)
-- ============================================================

CREATE INDEX idx_messages_session          ON messages(session_id, created_at DESC);
CREATE INDEX idx_messages_clone_user       ON messages(clone_id, user_id, created_at DESC);
CREATE INDEX idx_messages_reconciliation   ON messages(status, reconciliation_status, created_at);  -- 린 3차: status 선행
CREATE INDEX idx_follows_user              ON follows(user_id);
CREATE INDEX idx_follows_clone             ON follows(clone_id);
CREATE INDEX idx_feeds_clone               ON feeds(clone_id, created_at DESC);
CREATE INDEX idx_clone_shares_target       ON clone_shares(target_user_id);
CREATE INDEX idx_clone_shares_email        ON clone_shares(invite_email);
CREATE INDEX idx_clone_shares_clone_role   ON clone_shares(clone_id, role);
CREATE INDEX idx_credit_ledgers_user       ON credit_ledgers(user_id, id DESC);
CREATE INDEX idx_credit_ledgers_user_id_cp ON credit_ledgers(user_id, id);
CREATE INDEX idx_notifications_user        ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_ad_impressions_keyword    ON ad_impressions(ad_keyword_id, created_at DESC);
CREATE INDEX idx_message_starred_user      ON message_starred(user_id, created_at DESC);
CREATE INDEX idx_message_starred_message   ON message_starred(message_id);
CREATE INDEX idx_invite_tokens_expires     ON invite_tokens(expires_at);
CREATE UNIQUE INDEX idx_user_devices_push_token ON user_devices(push_token);
CREATE INDEX idx_admin_audit_admin         ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_action        ON admin_audit_logs(action, created_at DESC);
CREATE INDEX idx_merge_conflicts_clone     ON merge_conflicts_pending(new_clone_id, user_id) WHERE resolved_at IS NULL;

-- ============================================================
-- TRIGGERS (PRD §7.7)
-- ============================================================

-- 공동소유 owner≥2 규칙 (공유자 3명 이상일 때만 적용)
CREATE TRIGGER trg_prevent_owner_drop_on_delete
BEFORE DELETE ON clone_shares
WHEN OLD.role = 'owner'
  AND (SELECT COUNT(*) FROM clone_shares WHERE clone_id = OLD.clone_id) >= 3
  AND (SELECT COUNT(*) FROM clone_shares WHERE clone_id = OLD.clone_id AND role = 'owner') < 2
BEGIN
  SELECT RAISE(ABORT, 'A memlow with 3+ users requires at least 2 owners.');
END;

CREATE TRIGGER trg_prevent_owner_demote_on_update
BEFORE UPDATE OF role ON clone_shares
WHEN OLD.role = 'owner' AND NEW.role != 'owner'
  AND (SELECT COUNT(*) FROM clone_shares WHERE clone_id = OLD.clone_id) >= 3
  AND (SELECT COUNT(*) FROM clone_shares WHERE clone_id = OLD.clone_id AND role = 'owner') < 2
BEGIN
  SELECT RAISE(ABORT, 'Cannot demote last required owner.');
END;

-- admin_audit_logs append-only
CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON admin_audit_logs
BEGIN
  SELECT RAISE(ABORT, 'admin_audit_logs is append-only; UPDATE forbidden.');
END;

CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON admin_audit_logs
BEGIN
  SELECT RAISE(ABORT, 'admin_audit_logs is append-only; DELETE forbidden.');
END;

-- messages 하드 삭제 금지 (소프트 폐기만 허용)
CREATE TRIGGER trg_messages_no_hard_delete
BEFORE DELETE ON messages
BEGIN
  SELECT RAISE(ABORT, 'messages uses soft purge; use UPDATE SET status=purged, content=NULL instead.');
END;

-- 소라 3차 Critical: 별표된 메시지는 purge 예외 — DB 레벨 안전망
CREATE TRIGGER trg_messages_prevent_purge_if_starred
BEFORE UPDATE OF status ON messages
WHEN NEW.status = 'purged' AND OLD.status != 'purged'
  AND EXISTS (SELECT 1 FROM message_starred WHERE message_id = OLD.id)
BEGIN
  SELECT RAISE(ABORT, 'Cannot purge starred messages; remove stars first.');
END;

-- credit_ledgers append-only
CREATE TRIGGER trg_credit_ledgers_no_update
BEFORE UPDATE ON credit_ledgers
BEGIN
  SELECT RAISE(ABORT, 'credit_ledgers is append-only; UPDATE forbidden.');
END;

CREATE TRIGGER trg_credit_ledgers_no_delete
BEFORE DELETE ON credit_ledgers
BEGIN
  SELECT RAISE(ABORT, 'credit_ledgers is append-only; DELETE forbidden.');
END;
