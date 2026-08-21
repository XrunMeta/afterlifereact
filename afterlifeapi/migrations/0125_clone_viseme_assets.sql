-- T-545: viseme_playback 파이프라인용 사전 렌더 립싱크 클립 참조 컬럼.
--
-- viseme_prefix: R2 prefix (예: "visemes/9126/") 아래에 clip_a.mp4 · clip_e.mp4 · clip_i.mp4 · clip_o.mp4 ·
--   clip_u.mp4 · clip_eo.mp4 · clip_eu.mp4 · clip_ae.mp4 · clip_bilabial.mp4 · clip_rest.mp4 (10개) 저장.
-- viseme_generated_at: 사전 렌더 완료 시각 (unixepoch ms). NULL = 미생성.
-- viseme_version: 렌더 알고리즘 버전 (호환성 · v1=MediaPipe 워핑, v2=neural lip-swap 등).
--
-- 페르소나 생성 시 background 잡이 얼굴 이미지에서 10 viseme 클립 생성 → R2 저장 → 이 컬럼 세팅.
-- 통화 시 클라이언트가 viseme_prefix 로 클립 다운로드 → 서버 TTS 오디오 + viseme 시퀀스 sync 재생.
--
-- ⚠️ 반드시 `wrangler d1 migrations apply` 로만. `--file` 직접 금지 (duplicate column name 오류).
ALTER TABLE clones ADD COLUMN viseme_prefix TEXT;
ALTER TABLE clones ADD COLUMN viseme_generated_at INTEGER;
ALTER TABLE clones ADD COLUMN viseme_version TEXT;
