-- afterlife 사용자와 xrun 계정/지갑을 연결하는 컬럼.
-- 가입 시 xrun /external/register 호출해 받은 member/guid 저장.
-- 이미 xrun에 같은 이메일이 있으면 409 → 별도 lookup으로 채울 수 있음.

ALTER TABLE users ADD COLUMN xrun_member_id  INTEGER;
ALTER TABLE users ADD COLUMN xrun_guid       TEXT;
ALTER TABLE users ADD COLUMN xrun_linked_at  TIMESTAMP;

CREATE INDEX idx_users_xrun_member ON users(xrun_member_id);
CREATE INDEX idx_users_xrun_guid   ON users(xrun_guid);
