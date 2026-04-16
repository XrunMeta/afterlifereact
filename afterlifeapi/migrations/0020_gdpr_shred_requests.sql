-- Critical 테마 (바) Slice 3: GDPR Crypto Shredding.
-- 유저 클레임 테이블 + audit op CHECK에 'shred_failed' 추가.

CREATE TABLE gdpr_shred_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  scope TEXT NOT NULL CHECK(scope IN ('user_all','resources')),
  resources_json TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK(status IN ('submitted','in_review','executed','rejected','cancelled')),
  quorum_request_id INTEGER REFERENCES admin_quorum_requests(id),
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  shredded_count INTEGER
);
CREATE INDEX idx_gdpr_shred_status ON gdpr_shred_requests(status);
CREATE INDEX idx_gdpr_shred_user   ON gdpr_shred_requests(user_id);

-- audit op CHECK 확장 — Slice 2 0019와 동일한 rename/recreate 패턴.
ALTER TABLE decryption_audit_log RENAME TO decryption_audit_log_old;

DROP TRIGGER IF EXISTS decryption_audit_log_no_update;
DROP TRIGGER IF EXISTS decryption_audit_log_no_delete;

CREATE TABLE decryption_audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','admin','heir','system')),
  actor_id        TEXT NOT NULL,
  ticket_id       TEXT,
  op              TEXT NOT NULL CHECK (op IN ('decrypt','shred','emergency','rotate','chain_verify','v2_migrate','shred_failed')),
  resource_type   TEXT NOT NULL,
  resource_id     TEXT NOT NULL,
  reason          TEXT,
  prev_hash       TEXT,
  row_hash        TEXT NOT NULL,
  ts              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO decryption_audit_log
  (id, actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash, ts)
SELECT
  id, actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash, ts
FROM decryption_audit_log_old;

DROP TABLE decryption_audit_log_old;

CREATE INDEX idx_decryption_audit_actor ON decryption_audit_log(actor_type, actor_id, ts DESC);
CREATE INDEX idx_decryption_audit_resource ON decryption_audit_log(resource_type, resource_id, ts DESC);
CREATE INDEX idx_decryption_audit_ts ON decryption_audit_log(ts DESC);

CREATE TRIGGER decryption_audit_log_no_update
BEFORE UPDATE ON decryption_audit_log
BEGIN
  SELECT RAISE(ABORT, 'decryption_audit_log is INSERT-only');
END;

CREATE TRIGGER decryption_audit_log_no_delete
BEFORE DELETE ON decryption_audit_log
BEGIN
  SELECT RAISE(ABORT, 'decryption_audit_log is INSERT-only');
END;
