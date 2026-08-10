-- M-6: credit_ledgers.type CHECK에 message_send 추가.
-- SQLite는 CHECK ALTER 불가 → 테이블 재생성 방식.
-- D1은 단일 트랜잭션으로 마이그레이션 실행하므로 중간 실패 시 롤백.

-- ⚠️ T-440: 여기 있던 `PRAGMA foreign_keys = OFF/ON` 두 줄을 제거했다.
--    D1 은 FK enforcement 를 끌 수 없고(0083 실측), 마이그는 트랜잭션 안에서 돌아
--    SQLite 명세상으로도 no-op 이다. 즉 그 줄은 **아무 것도 보호하지 않으면서**
--    "자식은 안전하다" 는 거짓 신호만 줬다. 실제로 이 파일이 지운 자식이 있다.
--    재생성 시 자식 보존은 보상 로직(_bak_ 백업→복원)으로만 가능하다.
--    규약: KB `T-440-D1테이블재생성-CASCADE파괴/README.md` · 가드: test/migrationCascadeGuard.test.ts

CREATE TABLE credit_ledgers_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount           INTEGER NOT NULL,
  type             TEXT NOT NULL
                    CHECK (type IN ('charge_inapp','charge_xrun','gift','clone_create','message_send','refund','admin_grant')),
  ref_id           TEXT,
  idempotency_key  TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, idempotency_key)
);

INSERT INTO credit_ledgers_new (id, user_id, amount, type, ref_id, idempotency_key, created_at)
  SELECT id, user_id, amount, type, ref_id, idempotency_key, created_at FROM credit_ledgers;

DROP TABLE credit_ledgers;
ALTER TABLE credit_ledgers_new RENAME TO credit_ledgers;

CREATE INDEX IF NOT EXISTS idx_ledgers_user_id_desc ON credit_ledgers(user_id, id DESC);

