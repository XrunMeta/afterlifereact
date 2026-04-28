-- xrun 측 지갑 주소를 afterlife users 테이블에도 저장 — 매번 외부 호출하지 않도록.
-- 신규 가입 시엔 register 응답에서, 중복(409) 시엔 wallet-by-email lookup에서 채움.

ALTER TABLE users ADD COLUMN xrun_wallet TEXT;

CREATE INDEX idx_users_xrun_wallet ON users(xrun_wallet);
