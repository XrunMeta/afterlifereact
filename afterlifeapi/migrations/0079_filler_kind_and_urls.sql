-- 0079_filler_kind_and_urls.sql
-- T-088 F1: (1) clone_asset_jobs.kind CHECK에 'filler' 허용 추가
--           (2) clones.filler_video_urls TEXT DEFAULT NULL 추가
--
-- SQLite는 ALTER TABLE MODIFY COLUMN / DROP CONSTRAINT 미지원.
-- CHECK 변경은 테이블 재작성(rename + copy + drop) 패턴으로 처리.
--
-- idempotent 전략:
--   - _clone_asset_jobs_new: DROP TABLE IF EXISTS 로 이전 실패 잔여물 정리 후 재작성.
--   - 인덱스: CREATE INDEX IF NOT EXISTS.
--   - clones ADD COLUMN: D1 마이그 관행(기존 0060 패턴) = IF NOT EXISTS 없이 단순 ADD.
--     D1 migration journal이 중복 실행을 방지하므로 단순 ADD가 관행.
--   - 기존 idle_video / voice_clone kind 데이터 전량 보존(INSERT INTO ... SELECT *).

-- ── ① clone_asset_jobs 테이블 재작성 ──────────────────────────────────────────

-- 이전 부분 실패로 잔여물이 있으면 정리 (재실행 안전망)
DROP TABLE IF EXISTS _clone_asset_jobs_new;

-- 'filler' 포함된 새 CHECK 제약으로 신규 테이블 생성
CREATE TABLE _clone_asset_jobs_new (
  id             TEXT    PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT    NOT NULL CHECK (kind IN ('idle_video','voice_clone','filler')),
  src_file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','running','done','failed')),
  out_file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
  out_url        TEXT,
  clone_id       INTEGER REFERENCES clones(id) ON DELETE SET NULL,
  callback_token TEXT,
  error          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 기존 데이터 전량 이전 (idle_video / voice_clone kind 보존)
-- 명시 컬럼 리스트: 향후 컬럼 추가 시 silent mismatch 방지 (sei R-1)
INSERT INTO _clone_asset_jobs_new (id, user_id, kind, src_file_id, status, out_file_id, out_url, clone_id, callback_token, error, created_at, updated_at)
SELECT id, user_id, kind, src_file_id, status, out_file_id, out_url, clone_id, callback_token, error, created_at, updated_at
FROM clone_asset_jobs;

-- 교체
DROP TABLE clone_asset_jobs;
ALTER TABLE _clone_asset_jobs_new RENAME TO clone_asset_jobs;

-- 인덱스 재생성 (IF NOT EXISTS로 멱등)
CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_user    ON clone_asset_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_clone   ON clone_asset_jobs(clone_id);
CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_out_url ON clone_asset_jobs(out_url);

-- ── ② clones.filler_video_urls 컬럼 추가 ─────────────────────────────────────
-- JSON 배열 직렬화. NULL = 필러 미생성(= 빈 배열 폴백, bundle 직렬화단에서 처리).
-- 기존 0060 패턴(idle_video_url / voice_se_url) 동일.
ALTER TABLE clones ADD COLUMN filler_video_urls TEXT;
