-- 0059_voice_presets_catalog.sql
-- voice_presets 를 관리자 관리형 음색 카탈로그로 확장.
-- additive: 컬럼 추가(상수 DEFAULT) → 기존 행 보존. 고민주 #0 seed, 목업 4행 비활성.

ALTER TABLE voice_presets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 100;
ALTER TABLE voice_presets ADD COLUMN is_active  INTEGER NOT NULL DEFAULT 1;
ALTER TABLE voice_presets ADD COLUMN r2_key     TEXT;
ALTER TABLE voice_presets ADD COLUMN se_key     TEXT;

-- 기존 목업(0002 seed) 4행 숨김 (데이터는 보존).
UPDATE voice_presets SET is_active = 0 WHERE sample_url LIKE '/samples/voice_%';

-- 고민주 #0 (R2 voice/sample/gominju.mp3 업로드 완료).
INSERT INTO voice_presets (name, gender, age_range, sample_url, description, sort_order, is_active, r2_key, se_key)
VALUES ('고민주', 'female', '20s', NULL, '기본 목소리 — 고민주', 0, 1, 'voice/sample/gominju.mp3', 'gominju');
