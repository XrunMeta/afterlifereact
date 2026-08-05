-- 0109_clone_person_faces.sql
-- T-257: 얼굴 인식 범위를 (user_id, clone_id) 1대1 공간으로 한정.
-- clone_ont_person(0082, L2′)은 무수정 — 이 마이그레이션은 additive.
-- !! 반드시 `wrangler d1 migrations apply` 로만 적용할 것.
-- !! `wrangler d1 execute --file` 직접 적용 절대 금지(0074/0082 헤더 규약 동일).
--
-- ⚠️ 환경 주의: wrangler.toml 상 preview 워커가 현재 PROD DB를 바라본다.
--    `--env preview` 적용이 prod에 반영되므로 히즈키 확인 후 실행할 것.

-- 1) 클론 스코프 벡터 장부. 기존 face_embeddings(person 단위)의 클론 스코프 버전.
--    D1은 FK enforcement가 실제로 기본 ON이다(0083 헤더 실측 근거) — CASCADE가 동작하며
--    앱 레벨 삭제(cloneFaceScope/personDelete)와 이중화된다.
CREATE TABLE IF NOT EXISTS clone_person_faces (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id     INTEGER NOT NULL,
  person_id    INTEGER NOT NULL,
  vectorize_id TEXT NOT NULL,
  model        TEXT,
  dim          INTEGER,
  source       TEXT NOT NULL DEFAULT 'enroll'
                 CHECK (source IN ('enroll','call','self')),
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cpf_clone_person ON clone_person_faces(clone_id, person_id);
CREATE INDEX IF NOT EXISTS idx_cpf_vectorize ON clone_person_faces(vectorize_id);

-- 2) self 표식. 클론당 self가 정확히 1개임이 스키마로 보장된다.
--    NULL = self 미확정, 또는 전문가 클론(self 개념 없음 — 영구 NULL).
ALTER TABLE clones ADD COLUMN self_person_id INTEGER;

-- 3) 폐기: clone_id IS NULL person을 전제로 한 부분 유니크 인덱스.
--    T-257 이후 clone_id NULL person은 존재하지 않으므로 존재 이유가 사라진다.
DROP INDEX IF EXISTS uq_persons_user_name_no_clone;
