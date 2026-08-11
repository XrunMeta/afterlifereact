-- 0114_call_experimental_base.sql
-- T-467: 앱이 clone.pipeline='echomimic_v3' 페르소나 통화 시 사용할 endpoint 를
-- app_config 에 세팅. 기존 rtc.example.invalid 도메인에 /prethird-exp/ 경로 (nginx 프록시)
-- → 127.0.0.1:8650 (가비아 prethird-exp) → EchoMimicV3 render_server(:8750).
--
-- 값이 없으면 앱은 pipeline 값 무시하고 기존 흐름 유지 (안전한 opt-in).

INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('call.experimental_base', 'https://rtc.example.invalid/prethird-exp');
