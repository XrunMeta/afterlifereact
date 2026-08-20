-- T-534 (2026-08-20): 선물 교환 크레딧을 별도 버킷으로 분리.
--   기존: gift swap → credits_topup 로 누적 (사용자 인식과 어긋남 — "충전" 아니라 "선물"에서 왔음)
--   변경: credits_gift 신설. 앱 잔액 카드에 "선물" pill 로 별도 표시.
--   spendCallTime 우선순위: free → sub → gift → topup (선물 먼저 소진, 충전은 마지막).

ALTER TABLE users ADD COLUMN credits_gift INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_credits_gift ON users(credits_gift);
