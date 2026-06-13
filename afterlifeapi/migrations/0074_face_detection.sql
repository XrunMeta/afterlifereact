-- 0074_face_detection.sql
-- 세션 A: face-id 검출 레이어. persons(통화 참여 화자) + face_embeddings(메타·다음 세션 벡터 전제) +
-- call_turns.speaker_person_id(검출된 화자 연결, 이번 세션은 NULL 유지 가능).
-- 원칙(amane/mizu): 원본 사진 저장 금지. 벡터는 Cloudflare Vectorize 네임스페이스(다음 세션 자리만 확보).
-- additive·idempotent. 기존 call_turns 행 보존(speaker_person_id NULL).
--
-- ⚠️ 트랜잭션 경계(sei BLOCKER 해소 — 경로 A):
--    Cloudflare D1은 SQL 레벨 명시 트랜잭션(BEGIN/COMMIT)을 지원하지 않는다(배치 API가 트랜잭션 역할).
--    wrangler d1 migrations apply는 각 마이그 파일을 원자적 배치로 적용하므로 부분 적용이 발생하지 않는다.
--    이 repo의 0001~0073 전 파일도 동일 관행(BEGIN/COMMIT 없음). 0074는 기존 관행을 따른다.
--    !! 반드시 `wrangler d1 migrations apply` 흐름으로 적용할 것.
--    !! `wrangler d1 execute --file 0074_face_detection.sql` 직접 적용 절대 금지.
--       직접 실행 시 CREATE TABLE(IF NOT EXISTS)는 재실행 통과하나 ALTER TABLE은
--       'duplicate column name' 으로 영구 실패(wrangler migrations의 적용 기록 없이 부분 상태).

CREATE TABLE IF NOT EXISTS persons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  clone_id      INTEGER,
  display_name  TEXT,
  consent_state TEXT NOT NULL DEFAULT 'none'
                  CHECK (consent_state IN ('none','granted','revoked')),
  consent_at    INTEGER,
  created_at    INTEGER NOT NULL,
  UNIQUE(user_id, clone_id, display_name)
);
CREATE INDEX IF NOT EXISTS idx_persons_user ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_clone ON persons(clone_id);

-- sei 반영: clone_id IS NULL 케이스에서 SQLite가 NULL을 distinct 취급하므로
-- UNIQUE(user_id, clone_id, display_name)만으로는 동일 user가 클론 무관 동명 persons를 중복 등록 가능.
-- 부분 유니크 인덱스로 (user_id, display_name) 중복을 차단(clone_id NOT NULL은 기존 UNIQUE 커버).
CREATE UNIQUE INDEX IF NOT EXISTS uq_persons_user_name_no_clone
  ON persons(user_id, display_name)
  WHERE clone_id IS NULL;

-- TODO(next session): consent_state='granted' 선행 가드를 API 레이어 또는 D1 트리거로 강제할 것(Vectorize write 세션 전).
-- TODO(next session): D1 FK는 기본 OFF — GDPR 삭제권 API에서 PRAGMA foreign_keys=ON 또는 수동 CASCADE 처리 필요.

-- amane BLOCKER + mizu H-1: 생체정보 동의 감사(GDPR Art.7 / PIPA) append-only 이력 테이블.
-- persons.consent_state/consent_at은 최신 스냅샷. 이력은 이 로그가 담당.
CREATE TABLE IF NOT EXISTS persons_consent_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  state         TEXT NOT NULL CHECK (state IN ('granted','revoked')),
  terms_version TEXT,             -- 동의한 약관 버전(TermsModal type4 버전 식별)
  channel       TEXT,             -- 동의 경로(예: 'app-ui','api')
  changed_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_consent_log_person ON persons_consent_log(person_id);

CREATE TABLE IF NOT EXISTS face_embeddings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  vectorize_id  TEXT,
  model         TEXT,
  dim           INTEGER,
  source        TEXT NOT NULL DEFAULT 'enroll'
                  CHECK (source IN ('enroll','call')),
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_face_embeddings_person ON face_embeddings(person_id);

-- Vectorize 네임스페이스 자리(주석): 다음 세션에서 wrangler.toml에
--   [[vectorize]] binding="FACE_VECTORS" index_name="afl-face-512" 추가. 본 마이그는 D1 스키마만.

-- ⚠️ SQLite ADD COLUMN은 IF NOT EXISTS 미지원. 재실행 시 'duplicate column name'.
--    wrangler d1 migrations 흐름으로 1회 적용. --file 직접 적용 시 PRAGMA(table_info) 사전 체크.
ALTER TABLE call_turns ADD COLUMN speaker_person_id INTEGER REFERENCES persons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_call_turns_speaker ON call_turns(speaker_person_id);
