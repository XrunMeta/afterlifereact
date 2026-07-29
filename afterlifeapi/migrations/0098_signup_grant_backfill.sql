-- 0098: 기존 가입자 전원에게 무료 50분(3,000크레딧) 소급 지급 (T-167).
--
-- granted_at = 마이그 실행 시각. 원 가입일이 아니다 — 감쇠(3개월 유예)의
-- 기산점을 지급 시점으로 맞추기 위함.
-- idempotency_key 는 signup:{user_id} 라 재실행해도 UNIQUE 로 막힌다.

INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
  SELECT id, 3000, 'signup_grant', 'backfill', 'signup:' || id
    FROM users
   WHERE deleted_at IS NULL;

UPDATE users
   SET credits_free    = credits_free + 3000,
       credits         = credits + 3000,
       free_granted_at = CAST(strftime('%s','now') AS INTEGER) * 1000,
       updated_at      = CURRENT_TIMESTAMP
 WHERE deleted_at IS NULL
   AND free_granted_at IS NULL;
