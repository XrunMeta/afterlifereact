-- Critical 테마 (바): 해시체인 감사로그 (오프라인 블록체인 방식)
-- INSERT-only: BEFORE UPDATE/DELETE 트리거로 수정 차단
-- row_hash = HMAC(secret, prev_hash || ts || actor || op || resource_id)

CREATE TABLE decryption_audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','admin','heir','system')),
  actor_id        TEXT NOT NULL,
  ticket_id       TEXT,                      -- 응급 복호화 ticket 참조
  op              TEXT NOT NULL CHECK (op IN ('decrypt','shred','emergency','rotate','chain_verify')),
  resource_type   TEXT NOT NULL,
  resource_id     TEXT NOT NULL,
  reason          TEXT,
  prev_hash       TEXT,                      -- 직전 row의 row_hash
  row_hash        TEXT NOT NULL,             -- HMAC(secret, prev_hash || ts || actor || op || resource_id)
  ts              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decryption_audit_actor ON decryption_audit_log(actor_type, actor_id, ts DESC);
CREATE INDEX idx_decryption_audit_resource ON decryption_audit_log(resource_type, resource_id, ts DESC);
CREATE INDEX idx_decryption_audit_ts ON decryption_audit_log(ts DESC);

-- INSERT-only 강제: UPDATE/DELETE 시도 시 예외
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
