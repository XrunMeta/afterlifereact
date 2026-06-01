-- SP3 시스템 'halbae' 클론 seed + L1 속성 EAV 미러.
-- 실데이터 교체는 신규 마이그 UPDATE로 — 본 파일 편집 금지.
-- username='halbae' UNIQUE → 멱등 INSERT OR IGNORE.
-- created_at/updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP (0001_init 스키마).
-- owner_id: email 기준 SELECT 동적 결정 (id 고정 금지 — B-1 BLOCKER 수정).

-- 시스템 소유자 user — 없으면 생성(AUTOINCREMENT id 사용).
-- password_hash='$SYSTEM$' 는 로그인 불가 sentinel(I-1).
INSERT OR IGNORE INTO users (name, email, password_hash, funnel_stage)
VALUES ('system', 'system@afterlife.internal', '$SYSTEM$', 'explorer');

-- email 기준으로 owner_id 를 동적 조회해 halbae 생성.
INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, l1_profile, training_status)
SELECT u.id,
  '할배',
  'halbae',
  'memlow',
  'public',
  json_object(
    'personality_core', '낙천적이고 정이 많으며 잔소리도 애정에서 나옴',
    'tone',             '느릿하고 다정한 경상도 사투리',
    'speech_patterns',  '아이고 우리 강아지; ~혀; 밥은 묵었나',
    'voice_style',      '천천히, 반말',
    'background',       '1945년생, 부산 출신, 평생 어부'
  ),
  'ready'
FROM users u
WHERE u.email = 'system@afterlife.internal'
  AND NOT EXISTS (SELECT 1 FROM clones WHERE username = 'halbae');

-- persona_attributes(level='l1') EAV 미러. 멱등.
-- R-1: 핵심 3건(personality_core/tone/speech_patterns) 필수 포함.
INSERT OR IGNORE INTO persona_attributes (clone_id, level, key, value)
SELECT c.id, 'l1', kv.key, kv.value
FROM clones c
CROSS JOIN (
  SELECT 'personality_core' AS key, '낙천적이고 정이 많으며 잔소리도 애정에서 나옴' AS value
  UNION ALL SELECT 'tone',            '느릿하고 다정한 경상도 사투리'
  UNION ALL SELECT 'speech_patterns', '아이고 우리 강아지; ~혀; 밥은 묵었나'
) kv
WHERE c.username = 'halbae';
