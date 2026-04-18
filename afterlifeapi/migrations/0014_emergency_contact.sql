-- Critical 테마 (마): 비상연락처 & 상속지정
-- 모든 유저 대상. 멤로우 소유자에게 가입 직후 강력 권장.
-- 셀럽 M7 Dead Man's Switch도 본 테이블로 통합.

CREATE TABLE emergency_contacts (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  principal_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_email        TEXT NOT NULL,
  contact_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- 수락 후 매칭
  role                 TEXT NOT NULL CHECK (role IN ('notify_only','primary_heir','secondary_heir')),
  trigger_condition    TEXT NOT NULL CHECK (trigger_condition IN ('inactivity_N_days','death_certificate','manual_admin')),
  trigger_param        TEXT,                  -- inactivity_N_days의 경우 N값 (예: '180')
  target_scope         TEXT NOT NULL,         -- 'account' | 'clone:{clone_id}'
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','accepted','declined','revoked')),
  invite_token_hash    TEXT UNIQUE,           -- sha256(raw_token)
  invited_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at          TIMESTAMP,
  declined_at          TIMESTAMP,
  revoked_at           TIMESTAMP,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_principal ON emergency_contacts(principal_user_id, status);
CREATE INDEX idx_emergency_contacts_contact ON emergency_contacts(contact_user_id, status) WHERE contact_user_id IS NOT NULL;
CREATE INDEX idx_emergency_contacts_trigger ON emergency_contacts(trigger_condition, status);

-- 상속 이관 이벤트 로그
CREATE TABLE inheritance_release_logs (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  emergency_contact_id    INTEGER NOT NULL REFERENCES emergency_contacts(id) ON DELETE RESTRICT,
  event                   TEXT NOT NULL CHECK (event IN (
                            'triggered','evidence_uploaded','admin_reviewed',
                            'approved','executed','revoked','rejected'
                          )),
  admin_user_id           INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  evidence_url            TEXT,               -- R2 경로 (사망진단서 등)
  quorum_signatures       TEXT,               -- JSON array of admin signatures
  decision                TEXT,               -- 'transfer_ownership' | 'read_only' | 'soft_delete'
  reason                  TEXT,
  ts                      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inheritance_logs_contact ON inheritance_release_logs(emergency_contact_id, ts DESC);
CREATE INDEX idx_inheritance_logs_event ON inheritance_release_logs(event, ts DESC);
