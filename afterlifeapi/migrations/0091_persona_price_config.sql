-- 0091: persona 유료 가격을 app_config 로 옮김 (관리자 페이지에서 조정 가능).
--   이전엔 clones.ts PERSONA_PAID_PRICE_XRUN = 100 하드코드.
--   초기값 0.001 (2026-07-23 사용자 요청).
INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('persona.paid_price_xrun', '0.001');
