-- M-6: credit_ledgers.type CHECK에 message_send 추가.
-- SQLite는 CHECK ALTER 불가 → 테이블 재생성 방식.
-- D1은 단일 트랜잭션으로 마이그레이션 실행하므로 중간 실패 시 롤백.

PRAGMA foreign_keys = OFF;

CREATE TABLE credit_ledgers_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount           INTEGER NOT NULL,
  type             TEXT NOT NULL
                    CHECK (type IN ('charge_inapp','charge_xrun','gift','clone_create','message_send','refund','admin_grant')),
  ref_id           TEXT,
  idempotency_key  TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, idempotency_key)
);

INSERT INTO credit_ledgers_new (id, user_id, amount, type, ref_id, idempotency_key, created_at)
  SELECT id, user_id, amount, type, ref_id, idempotency_key, created_at FROM credit_ledgers;

DROP TABLE credit_ledgers;
ALTER TABLE credit_ledgers_new RENAME TO credit_ledgers;

CREATE INDEX IF NOT EXISTS idx_ledgers_user_id_desc ON credit_ledgers(user_id, id DESC);

PRAGMA foreign_keys = ON;
