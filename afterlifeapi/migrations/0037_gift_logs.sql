-- gift_logs — 페르소나 선물 송금 원장.
-- 사용자가 60% 회사 wallet + 40% 페르소나 owner wallet 으로 분할 송금한 기록.
-- xrun 게이트웨이의 external-transfer-split 응답에서 받은 tx hash 저장.

CREATE TABLE gift_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clone_id        INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  owner_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gift_id         TEXT NOT NULL,
  gift_name       TEXT NOT NULL,
  total_amount    REAL NOT NULL,                              -- 사용자가 결제한 총 XRUN
  company_amount  REAL NOT NULL,                              -- 회사 wallet 으로 간 60%
  owner_amount    REAL NOT NULL,                              -- 페르소나 owner 로 간 40%
  company_address TEXT NOT NULL,                              -- 회사 wallet 주소 (env 시점 값 snapshot)
  owner_address   TEXT,                                       -- 페르소나 owner xrun wallet
  tx_company      TEXT,                                       -- 회사로 transfer tx hash
  tx_owner        TEXT,                                       -- owner 로 transfer tx hash
  -- pending: 호출 직전 / sent: 게이트웨이 200 / failed: 게이트웨이 실패
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'failed')),
  failure_reason  TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    TIMESTAMP
);

CREATE INDEX idx_gift_logs_sender ON gift_logs(sender_user_id, created_at DESC);
CREATE INDEX idx_gift_logs_clone ON gift_logs(clone_id, created_at DESC);
CREATE INDEX idx_gift_logs_owner ON gift_logs(owner_user_id, created_at DESC);
