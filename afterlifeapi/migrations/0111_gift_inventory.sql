-- 🔥 [2026-08-06] T-350: 오프체인 선물 인벤토리.
--   기존 clones.ts POST /oth-path 는 xrun 온체인 60/40 전송이었지만,
--   신규 흐름: A 크레딧 차감 → B 인벤토리(꽃/보약 등) 증가 (오프체인).
--   B 가 XRUN 지갑 앱에서 [교환] 클릭 시 인벤토리 차감 + B 크레딧 증가.
--
-- 스키마: (user_id, gift_id) UNIQUE — 같은 선물 아이템은 count 로 누적.
CREATE TABLE IF NOT EXISTS user_gift_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  gift_id TEXT NOT NULL,           -- gift_catalog items[].id (예: 'gift-flower')
  count INTEGER NOT NULL DEFAULT 0,  -- 잔여 개수 (교환하면 감소, 0 되면 표시 X)
  total_received INTEGER NOT NULL DEFAULT 0,  -- 지금까지 받은 누적 (감사용)
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, gift_id),
  CHECK (count >= 0),
  CHECK (total_received >= 0)
);
CREATE INDEX IF NOT EXISTS idx_gift_inv_user ON user_gift_inventory(user_id);

-- 선물 이벤트 로그 (A→B 이력). gift_logs 는 기존 온체인 흐름용이라 신규 테이블.
--   swap 이력도 여기에 (kind='sent' / 'received' / 'swapped').
CREATE TABLE IF NOT EXISTS gift_inventory_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  counterpart_user_id INTEGER,     -- sender (kind='received') or receiver (kind='sent'). swapped 는 NULL
  gift_id TEXT NOT NULL,
  count INTEGER NOT NULL,           -- 이벤트 시점 변화량 (양수)
  xrun_amount INTEGER NOT NULL,     -- 개당 XRUN 가격 × count (정산 스냅샷)
  kind TEXT NOT NULL CHECK (kind IN ('sent', 'received', 'swapped')),
  ref_id TEXT,                       -- gift 카탈로그 스냅샷 or swap idempotency key
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_gift_inv_evt_user ON gift_inventory_events(user_id, created_at DESC);
