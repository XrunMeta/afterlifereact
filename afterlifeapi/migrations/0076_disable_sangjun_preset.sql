-- 0076_disable_sangjun_preset.sql
-- 음성 프리셋 "상준" 비활성화.
--
-- 근본원인:
--   상준 원본 음성 파일(voice/sample/sangjun.mp3)이 약 108KB(~7초)로 너무 짧아,
--   가비아 OpenVoice se_extractor의 split_audio_vad가
--   "AssertionError: input audio is too short" 로 실패한다.
--   → voice_clone job failed → clones.voice_se_url이 NULL로 남음
--   → prethird 통화에서 무음(발화 skip). 클론 9058에서 실증 확인됨.
--
-- 조치 방침:
--   데이터는 삭제하지 않고 보존한다(is_active = 0).
--   나중에 충분한 길이의 원본 파일로 교체 후 is_active = 1 로 재활성 가능.
--   나머지 8종(397KB~1.68MB)은 정상이므로 절대 건드리지 않는다.
--
-- idempotent: 여러 번 실행해도 동일 결과(이미 0이면 그대로 0).
-- 환경독립: id(AUTOINCREMENT, 환경마다 상이) 대신 r2_key로 매칭.

UPDATE voice_presets
SET    is_active = 0
WHERE  r2_key = 'voice/sample/sangjun.mp3';
