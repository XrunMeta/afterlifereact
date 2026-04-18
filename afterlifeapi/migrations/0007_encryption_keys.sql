-- Critical 테마 (바): ALE v3 암호화 체계 — KEK/DEK 2계층 + Lazy Rotation
-- MASTER ROOT(Workers Secret) → KEK_vN(90일 주기) → DEK_{resource}(리소스별)

CREATE TABLE encryption_keys (
  kek_id          TEXT PRIMARY KEY,          -- 'kek_v1', 'kek_v2', ...
  version         INTEGER NOT NULL,
  algorithm       TEXT NOT NULL DEFAULT 'AES-256-GCM',
  encrypted_kek   TEXT NOT NULL,             -- MASTER로 암호화된 KEK
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','retiring','retired')),
  rotated_at      TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encryption_keys_status ON encryption_keys(status);
CREATE UNIQUE INDEX idx_encryption_keys_version ON encryption_keys(version);

CREATE TABLE dek_registry (
  dek_id          TEXT PRIMARY KEY,          -- uuid or 'dek_{resource_type}_{resource_id}'
  resource_type   TEXT NOT NULL,             -- 'user', 'clone', 'message', 'admin_totp', ...
  resource_id     TEXT NOT NULL,
  kek_id          TEXT NOT NULL REFERENCES encryption_keys(kek_id) ON DELETE RESTRICT,
  encrypted_dek   TEXT NOT NULL,             -- KEK로 암호화된 DEK
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  shredded_at     TIMESTAMP                  -- Crypto Shredding 실행 시 기록
);

CREATE UNIQUE INDEX idx_dek_registry_resource ON dek_registry(resource_type, resource_id);
CREATE INDEX idx_dek_registry_kek ON dek_registry(kek_id);
CREATE INDEX idx_dek_registry_shredded ON dek_registry(shredded_at) WHERE shredded_at IS NOT NULL;
