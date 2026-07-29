-- 0095: credit_ledgers.type CHECK 에 통화 과금 타입 5종 추가 (T-167).
-- 0005 와 동일한 테이블 재생성 패턴. charge_xrun 은 과거 레코드 보존용으로 유지
-- (신규 기록 경로만 이후 태스크에서 제거).
--
-- ⚠️ 0009 에서 credit_ledgers 를 참조하는 VIEW 2개 존재 → DROP 전에 VIEW 먼저 삭제,
--    RENAME 후 재생성. 안 그러면 다음 배포에서 "no such table: credit_ledgers" 로 깨짐.

PRAGMA foreign_keys = OFF;

DROP VIEW IF EXISTS v_credit_balance;
DROP VIEW IF EXISTS v_credit_ledger_running;

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

-- 0009 에서 만든 뷰 2개 재생성 (동일 정의).
CREATE VIEW v_credit_balance AS
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS balance
  FROM credit_ledgers
  GROUP BY user_id;

CREATE VIEW v_credit_ledger_running AS
  SELECT
    id,
    user_id,
    amount,
    type,
    ref_id,
    idempotency_key,
    created_at,
    SUM(amount) OVER (PARTITION BY user_id ORDER BY id) AS running_balance
  FROM credit_ledgers;

PRAGMA foreign_keys = ON;
