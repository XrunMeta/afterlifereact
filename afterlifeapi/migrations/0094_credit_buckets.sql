-- 0094: 크레딧 3버킷 분리 (T-167).
--
-- users.credits 는 세 버킷의 합계로 유지한다(하위호환 — 기존 spend()/grant()
-- 소비자인 gift·message_send·clone_create 가 그대로 동작해야 함).
-- 기존 잔액은 만료 없는 충전분으로 간주해 credits_topup 으로 이관한다.

ALTER TABLE users ADD COLUMN credits_free  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN credits_sub   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN credits_topup INTEGER NOT NULL DEFAULT 0;

-- 무료 크레딧 감쇠 추적 (PRICING.md §3): granted_at 은 ms epoch.
ALTER TABLE users ADD COLUMN free_granted_at     INTEGER;
ALTER TABLE users ADD COLUMN free_decayed_months INTEGER NOT NULL DEFAULT 0;

-- 기존 잔액은 만료 없는 충전분으로 이관 — lot 은 만들지 않는다.
UPDATE users SET credits_topup = credits WHERE credits > 0;
