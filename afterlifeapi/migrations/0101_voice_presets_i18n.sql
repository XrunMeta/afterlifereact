-- 0101_voice_presets_i18n.sql
-- 음색 카탈로그 다국어 이름 지원. 기존 `name` 컬럼은 한국어 정본(fallback)으로 유지.
-- 관리자 UI 에서 언어별 이름을 채워넣으면 앱이 사용자 언어에 맞춰 표시한다.
-- 파괴적 X — 컬럼 추가만. 기존 데이터는 4개 컬럼 모두 NULL 로 시작하며, 관리자가 나중에 채워넣는다.

ALTER TABLE voice_presets ADD COLUMN name_en    TEXT;
ALTER TABLE voice_presets ADD COLUMN name_ja    TEXT;
ALTER TABLE voice_presets ADD COLUMN name_zh_cn TEXT;
ALTER TABLE voice_presets ADD COLUMN name_id    TEXT;
