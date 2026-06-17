-- 0077_clone_asset_jobs_out_url_index.sql
-- bundle 조립 시 out_url로 clone_asset_jobs를 조회(faceUrl/voiceRawUrl).
--
-- 배경:
--   buildCallBundle은 통화 진입마다 호출된다.
--   faceUrl·voiceRawUrl 두 쿼리 모두 clone_asset_jobs.out_url 로 필터하므로
--   인덱스 없으면 매 통화 진입 시 full scan 발생.
--   idx_clone_asset_jobs_out_url 하나로 두 쿼리 모두 혜택.
--
-- idempotent: IF NOT EXISTS 로 중복 실행 무해.

CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_out_url ON clone_asset_jobs(out_url);
