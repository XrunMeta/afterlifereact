-- 0082_face_speaker_l2p.sql
-- T-067: L2' 화자별 관계 컨텍스트. 기존 clone_ont(L2, user_id 키)는 무수정.
-- additive·idempotent — 0074 트랜잭션 경계 규약과 동일(D1 명시 트랜잭션 미지원,
-- wrangler d1 migrations apply 가 원자적 배치로 적용).
-- !! 반드시 `wrangler d1 migrations apply` 로만 적용할 것.
-- !! `wrangler d1 execute --file 0082_face_speaker_l2p.sql` 직접 적용 절대 금지
--    (0074 헤더 규약 동일 — 직접 실행 시 재실행 실패로 부분 상태 위험).

CREATE TABLE IF NOT EXISTS clone_ont_person (
  clone_id        INTEGER NOT NULL,
  person_id       INTEGER NOT NULL,
  data            TEXT NOT NULL,
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  auto_learned_at INTEGER,
  PRIMARY KEY (clone_id, person_id),
  -- 정정(0083): D1은 실제로 FK enforcement 기본 ON이다(0074/0082의 기존 "FK OFF" 주석은 오류,
  -- 0083 헤더에 근거·실측 기록). 즉 이 ON DELETE CASCADE는 실제로 동작한다 — 다만 앱 레벨 배치
  -- (DELETE /oth-path 핸들러)가 명시적으로 clone_ont_person을 먼저 지우므로 이중화·무해.
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_clone_ont_person_person ON clone_ont_person(person_id);
