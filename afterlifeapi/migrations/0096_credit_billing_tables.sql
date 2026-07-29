-- 0096: 크레딧 과금 신규 테이블 3종 (T-167).
-- FK 는 D1 에서 기본 ON 이다. 원장·결제 이력이 사용자 삭제로 파괴되지 않도록 전부 RESTRICT.

-- 충전분 lot — 건별 5년 만료 추적. 무료(1회)·구독(월 리셋)은 lot 을 만들지 않는다.
CREATE TABLE credit_lots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount      INTEGER NOT NULL,
  remaining   INTEGER NOT NULL,
  granted_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  ledger_id   INTEGER NOT NULL REFERENCES credit_ledgers(id) ON DELETE RESTRICT,
  CHECK (remaining >= 0 AND remaining <= amount)
);
CREATE INDEX idx_credit_lots_user_expiry ON credit_lots(user_id, expires_at);

CREATE TABLE subscriptions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  platform             TEXT NOT NULL CHECK (platform IN ('ios','android')),
  product_id           TEXT NOT NULL,
  plan_code            TEXT NOT NULL
                        CHECK (plan_code IN ('light','basic','standard','plus','premium')),
  status               TEXT NOT NULL
                        CHECK (status IN ('active','grace','expired','canceled','refunded')),
  original_tx_id       TEXT NOT NULL,
  current_period_start INTEGER NOT NULL,
  current_period_end   INTEGER NOT NULL,
  auto_renew           INTEGER NOT NULL DEFAULT 1,
  updated_at           INTEGER NOT NULL,
  UNIQUE(platform, original_tx_id)
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);

-- 중복 지급을 스키마 차원에서 차단하는 단일 방어선.
CREATE TABLE iap_transactions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  platform       TEXT NOT NULL CHECK (platform IN ('ios','android')),
  transaction_id TEXT NOT NULL,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id     TEXT NOT NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('subscription','consumable')),
  credits        INTEGER NOT NULL,
  verified_at    INTEGER NOT NULL,
  raw_payload    TEXT,
  UNIQUE(platform, transaction_id)
);
CREATE INDEX idx_iap_tx_user ON iap_transactions(user_id, verified_at DESC);
