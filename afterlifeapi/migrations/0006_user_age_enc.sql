-- M-6: users.age는 평문 INTEGER. PII 보호를 위해 age_enc(ALE) 추가.
-- 기존 age 컬럼은 deprecated 유지(dev 환경 롤백 여지 + 집계 호환), 신규 쓰기는 age_enc만.
-- 읽기 경로: age_enc 우선, 없으면 age fallback.

ALTER TABLE users ADD COLUMN age_enc TEXT;
