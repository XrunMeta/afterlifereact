-- 0095: credit_ledgers.type CHECK 에 통화 과금 타입 5종 추가 (T-167).
-- 0005 와 동일한 테이블 재생성 패턴. charge_xrun 은 과거 레코드 보존용으로 유지
-- (신규 기록 경로만 이후 태스크에서 제거).

PRAGMA foreign_keys = OFF;

CREATE TABLE credit_ledgers_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount           INTEGER NOT NULL,
  type             TEXT NOT NULL
                    CHECK (type IN ('charge_inapp','charge_xrun','gift','clone_create',
                                    'message_send','refund','admin_grant',
                                    'call_usage','signup_grant','subscription_grant',
                                    'free_decay','topup_expire')),
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
