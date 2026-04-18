-- Critical 테마 (사): credit_ledgers.balance_after 제거 → 뷰 2개로 대체
-- 0001_init에 balance_after 컬럼은 이미 없음. 본 마이그레이션은 뷰만 생성.
-- balance 계산: 원장 SUM. 러닝 밸런스: 윈도우 함수.

-- 현재 잔액 뷰
CREATE VIEW v_credit_balance AS
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS balance
  FROM credit_ledgers
  GROUP BY user_id;

-- 러닝 밸런스 뷰 (이력 조회용)
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
