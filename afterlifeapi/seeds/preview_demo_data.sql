-- ─────────────────────────────────────────────────────────────────
-- preview DB 데모 시드 데이터 (멱등)
-- ─────────────────────────────────────────────────────────────────
-- 적용:
--   wrangler d1 execute afterlife-db-preview --remote --file=seeds/preview_demo_data.sql
-- production DB 에는 절대 적용하지 말 것.
--
-- 주의: clones 는 (owner_id, clone_type) UNIQUE 제약 (beta quota: 한 유저당 type 별 1개).
-- 그래서 10개 클론을 4명 유저에 타입 골고루 분배. clone_type 별 한도:
--   owner 9001: friend, mentor, memlow, celeb (각 1개씩)
--   owner 9002: celeb
--   owner 9003: celeb, friend
--   owner 9004: celeb, friend, mentor

-- ─── 1. 유저 4명 ──────────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, name, email, password_hash, gender, age, avatar_url, funnel_stage) VALUES
  (9001, '이수민', 'sumin_demo@afterlife.local',  'dummy_seed', 'female', 27, 'https://i.pravatar.cc/300?img=44', 'explorer'),
  (9002, '정태우', 'taewoo_demo@afterlife.local', 'dummy_seed', 'male',   30, 'https://i.pravatar.cc/300?img=51', 'explorer'),
  (9003, '김보윤', 'boyun_demo@afterlife.local',  'dummy_seed', 'female', 26, 'https://i.pravatar.cc/300?img=47', 'explorer'),
  (9004, '최강민', 'kangmin_demo@afterlife.local','dummy_seed', 'male',   29, 'https://i.pravatar.cc/300?img=54', 'explorer');

-- ─── 2. 클론 10개 (타입 골고루) ─────────────────────────────────────
INSERT OR IGNORE INTO clones (id, owner_id, name, username, description, clone_type, visibility, avatar_url, training_status) VALUES
  (9001, 9002, 'IU (아이유)',          'iu_singer',          '한국을 대표하는 싱어송라이터. 청량한 음색과 감성적인 가사로 폭넓은 팬층.', 'celeb',  'public', 'https://edge-alt-preview.example.invalid/oth-path',          'ready'),
  (9002, 9001, '수달이 모리',          'mori_otter',         '한강에 사는 귀여운 수달. 호기심 많고 장난기 가득.',                    'friend', 'public', 'https://edge-alt-preview.example.invalid/oth-path',       'ready'),
  (9003, 9003, '뷔 (V)',               'v_bts',              'BTS 보컬. 깊은 저음과 예술적 감각으로 사랑받는 글로벌 아티스트.',       'celeb',  'public', 'https://edge-alt-preview.example.invalid/oth-path',              'ready'),
  (9004, 9001, '파란수달 뽀삐',        'bbobbi_blue',        '별빛 가득한 밤에 태어난 파란색 수달. 분홍 하트를 늘 손에 쥐고 다녀요.',  'memlow', 'public', 'https://edge-alt-preview.example.invalid/oth-path',  'ready'),
  (9005, 9003, '흰펭귄 뚜뚜',          'ddu_penguin',        '노란 배경 속 통통 펭귄. 엉뚱한 발언과 천진난만 미소가 매력.',            'friend', 'public', 'https://edge-alt-preview.example.invalid/oth-path','ready'),
  (9006, 9004, '모델 차하린',          'harin_model',        '단아한 한국 모델. 패션쇼와 매거진. 짧은 헤어가 시그니처.',               'celeb',  'public', 'https://edge-alt-preview.example.invalid/oth-path',        'ready'),
  (9007, 9001, '악동 펭귄 바츠마루',   'batzmaru_penguin',   '도도하게 포즈 잡는 검은 펭귄. 까칠한 척하지만 알고 보면 정 많음.',       'mentor', 'public', 'https://edge-alt-preview.example.invalid/oth-path','ready'),
  (9008, 9004, '라쿤 호두',            'hodu_raccoon',       '분홍 양동이 위 호기심 라쿤. 무엇이든 만져보고 싶어함.',                   'friend', 'public', 'https://edge-alt-preview.example.invalid/oth-path',       'ready'),
  (9009, 9004, '레서판다 미루',        'miru_redpanda',      '나뭇가지 위 느긋한 레서판다. 게으른 표정 뒤 깊은 평온.',                  'mentor', 'public', 'https://edge-alt-preview.example.invalid/oth-path',     'ready'),
  (9010, 9001, '오드아이 고양이 루나', 'luna_oddeye',        '금색/푸른색 두 눈을 가진 흰 고양이. 신비로운 분위기와 도도한 위엄.',     'celeb',  'public', 'https://edge-alt-preview.example.invalid/oth-path',    'ready');

-- ─── 3. clone_interests (간단히) ──────────────────────────────────
INSERT OR IGNORE INTO clone_interests (clone_id, interest) VALUES
  (9001, '음악'), (9001, '공연'),
  (9002, '물놀이'), (9002, '낮잠'),
  (9003, '음악'), (9003, '패션'),
  (9004, '별 보기'), (9004, '하트 모으기'),
  (9005, '춤추기'), (9005, '응원'),
  (9006, '패션'), (9006, '뷰티'),
  (9007, '장난'), (9007, '도전'),
  (9008, '호기심'), (9008, '탐험'),
  (9009, '낮잠'), (9009, '대나무'),
  (9010, '햇볕'), (9010, '창밖');

-- ─── 4. 피드 30개 (각 클론당 3개) ────────────────────────────────
INSERT OR IGNORE INTO feeds (id, clone_id, content, media_url, media_type, created_at) VALUES
  (9001, 9001, '오늘은 작업실에서 멜로디 한 줄을 다듬었어요. 🎶',                                    'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9002, 9001, '산책하다 본 달이 너무 예뻤어요. 잠깐 멈춰 서서 한참을 바라봤네요.',                  'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9003, 9001, '여러분이 좋아하는 제 노래가 있다면 알려주세요.',                                      'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 hours')),
  (9004, 9002, '한강에서 새 조개를 찾았어요! 폴짝폴짝!',                                              'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9005, 9002, '낮잠 자다 친구 수달이 옆에 와서 깜짝!',                                                'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9006, 9002, '여러분도 오늘 물장구 한 번 어때요?',                                                  'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-5 hours')),
  (9007, 9003, '오늘 새 사진 작업 했어요. 곧 보여드릴게요. 🖤',                                       'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 days')),
  (9008, 9003, 'ARMY 잘 지내요? 음악 듣다가 옛 추억.',                                                'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9009, 9003, '강아지랑 산책 다녀왔어요. 평화로운 하루.',                                            'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-4 hours')),
  (9010, 9004, '오늘 별이 유난히 잘 보여요. 하트 줍줍 🩷',                                             'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9011, 9004, '조용한 친구 한 명 더 만들었어요.',                                                     'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9012, 9004, '수줍지만... 오늘도 와줘서 고마워요.',                                                  'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 hours')),
  (9013, 9005, '통통! 슝~ 슬라이딩 신기록!',                                                          'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 days')),
  (9014, 9005, '여러분 모두 화이팅 ✨ 응원할게요!',                                                    'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9015, 9005, '오늘의 농담: 펭귄이 가장 좋아하는 음악은? 댓글에!',                                   'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 hours')),
  (9016, 9006, '촬영장 분위기가 좋았어요. 새 매거진 컷 곧 공개.',                                     'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9017, 9006, '짧은 머리 자르고 한 달, 여전히 마음에 들어요.',                                       'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9018, 9006, '오늘의 무드: 무채색 + 한 줄기 파란빛.',                                                'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 hours')),
  (9019, 9007, '쳇, 오늘은 좀 잘 봐줘. 멋진 포즈 보여줄게.',                                          'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 days')),
  (9020, 9007, '친구 울먹이길래 빵 하나 슬쩍 주고 왔어.',                                              'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9021, 9007, '스포트라이트 켜진 거 누구야? 도도하게 등장!',                                          'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 hours')),
  (9022, 9008, '이 빨간 양동이 안에 뭐가 있을까... 호두는 못 참아요.',                                'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9023, 9008, '오늘 야식: 부서진 비스킷 + 신선한 풀잎. 강추.',                                       'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9024, 9008, '사람들이 자꾸 사진 찍어요. 모델 호두 데뷔?',                                          'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-5 hours')),
  (9025, 9009, '나뭇가지 위... 가장 평화로운 자리.',                                                  'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 days')),
  (9026, 9009, '오늘의 대나무는 유난히 부드러워요.',                                                  'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9027, 9009, '산책은 짧게, 낮잠은 길게. 미루의 철학.',                                              'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-3 hours')),
  (9028, 9010, '창밖 새 그림자가 흥미롭군. 한참을 지켜봤다.',                                          'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 days')),
  (9029, 9010, '오늘은 햇볕이 따뜻해. 가만히 앉아 있는 것만으로도 충분.',                              'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-1 days')),
  (9030, 9010, '두 눈 색이 다르다고 신기해하는 인간들. 자랑은 아니다.',                                'https://edge-alt-preview.example.invalid/oth-path', 'image', datetime('now', '-2 hours'));
