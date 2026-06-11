-- 0073_voice_preset_src_file.sql
-- voice_presets 를 "업로드 잡" 노선과 연결: 카탈로그 음성의 원본 파일(files.id)을 가리킨다.
-- additive: nullable 컬럼 1개. 기존 행(고민주 등) 보존, src_file_id IS NULL.
-- src_file_id 가 있으면 RN 은 voice_preset_id 대신 src_file_id 로 voice_clone job 을 만든다.
-- ⚠️ 1회만 실행(sei R-1): SQLite 는 ADD COLUMN IF NOT EXISTS 미지원 → 재실행 시
--    'duplicate column name: src_file_id' 로 실패. 가능하면 wrangler d1 migrations 흐름으로 적용하고,
--    --file 직접 실행 시 Task 10 Step 2 의 사전 PRAGMA 체크를 반드시 거친다.
ALTER TABLE voice_presets ADD COLUMN src_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;
