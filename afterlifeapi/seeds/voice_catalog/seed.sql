-- seed.sql — 음색 카탈로그 9종. upload.sh 가 R2 put 후 적용.
-- ⚠️ OR IGNORE 필수(OR REPLACE 금지): REPLACE 는 DELETE+INSERT 라 재실행 시
--    voice_presets 행 삭제 → clones.voice_preset_id ON DELETE SET NULL 연쇄로 기존 바인딩 단절,
--    files 행 삭제 → clone_asset_jobs.src_file_id ON DELETE RESTRICT 위반으로 마이그 중단(sei B-1).
-- files: 시스템 소유 공용 음원(purpose='voice_catalog'). r2_key 는 R2 객체 키와 일치.
-- size_bytes 는 0 placeholder → upload.sh 가 R2 put 후 실제 크기로 UPDATE(sei I-1).
INSERT OR IGNORE INTO files (id, r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES
  (9500, 'voice/sample/yeongji.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9501, 'voice/sample/miju.mp3',    'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9502, 'voice/sample/yeonhwa.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9503, 'voice/sample/sangjun.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9504, 'voice/sample/cheolsu.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9505, 'voice/sample/hocheol.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9506, 'voice/sample/wonmi.mp3',   'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9507, 'voice/sample/cheongi.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog'),
  (9508, 'voice/sample/geumi.mp3',   'audio/mpeg', 0, NULL, 'voice_catalog');

-- voice_presets: 카탈로그 노출용. r2_key=미리듣기, src_file_id=job src, se_key=NULL(=업로드 노선).
INSERT OR IGNORE INTO voice_presets
  (id, name, gender, age_range, description, sort_order, is_active, r2_key, se_key, src_file_id) VALUES
  (9510, '영지',     NULL, NULL, NULL, 1, 1, 'voice/sample/yeongji.mp3', NULL, 9500),
  (9511, '미주',     NULL, NULL, NULL, 2, 1, 'voice/sample/miju.mp3',    NULL, 9501),
  (9512, '연화스님', NULL, NULL, NULL, 3, 1, 'voice/sample/yeonhwa.mp3', NULL, 9502),
  (9513, '상준',     NULL, NULL, NULL, 4, 1, 'voice/sample/sangjun.mp3', NULL, 9503),
  (9514, '철수',     NULL, NULL, NULL, 5, 1, 'voice/sample/cheolsu.mp3', NULL, 9504),
  (9515, '호철',     NULL, NULL, NULL, 6, 1, 'voice/sample/hocheol.mp3', NULL, 9505),
  (9516, '원미',     NULL, NULL, NULL, 7, 1, 'voice/sample/wonmi.mp3',   NULL, 9506),
  (9517, '청이',     NULL, NULL, NULL, 8, 1, 'voice/sample/cheongi.mp3', NULL, 9507),
  (9518, '금이',     NULL, NULL, NULL, 9, 1, 'voice/sample/geumi.mp3',   NULL, 9508);

-- 고민주(#0) 비활성 — 9종으로 교체(데이터 보존).
UPDATE voice_presets SET is_active = 0 WHERE name = '고민주';
