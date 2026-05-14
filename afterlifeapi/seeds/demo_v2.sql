-- 데모 시드 v2 (2026-05-14): 기존 9001-9010 더미 모두 삭제 후 새로 생성.
--
-- 구성:
--   유저 3명: 9001 (민수), 9004 (지호), 9005 (서준)
--   클론 7개:
--     9001 의 페르소나: 9002, 9003
--     9004 의 페르소나: 9006, 9007
--     9005 의 페르소나: 9008, 9009, 9010
--   각 클론의 description 에 #태그 3개 이상 포함.
--   파일: 8001~8010 (이미지 R2 객체와 매핑).
--
-- 사전 단계 (이 SQL 적용 전):
--   wrangler r2 object put afterlife-archive-dev/uploadedfiles/seed/v2/p1.png  --file=afterlifeapi/seeds/images/persona1.png  --remote
--   ... (10개 동일 패턴)
--
-- 적용:
--   wrangler d1 execute afterlife-db-preview --remote --file=afterlifeapi/seeds/demo_v2.sql

-- ─── 0) 기존 더미 정리 ─────────────────────────────────────
DELETE FROM feeds            WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clone_interests  WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clone_stats      WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clone_shares     WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clone_follows    WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clone_blocks     WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM messages         WHERE clone_id BETWEEN 9001 AND 9010;
DELETE FROM clones           WHERE id BETWEEN 9001 AND 9010;
DELETE FROM user_interests   WHERE user_id BETWEEN 9001 AND 9010;
DELETE FROM users            WHERE id BETWEEN 9001 AND 9010;
DELETE FROM files            WHERE id BETWEEN 8001 AND 8010;

-- ─── 1) 파일(아바타) 레코드 ─────────────────────────────────
-- r2_key 는 R2 에 미리 PUT 한 객체 키와 동일해야 함.
-- 'image/png' 가 모든 10개에 적용 (확장자 png).
INSERT INTO files (id, r2_key, content_type, size_bytes, owner_user_id, purpose, created_at) VALUES
  (8001, 'uploadedfiles/seed/v2/p1.png',  'image/png', 200000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8002, 'uploadedfiles/seed/v2/p2.png',  'image/png', 160000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8003, 'uploadedfiles/seed/v2/p3.png',  'image/png', 165000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8004, 'uploadedfiles/seed/v2/p4.png',  'image/png', 135000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8005, 'uploadedfiles/seed/v2/p5.png',  'image/png', 150000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8006, 'uploadedfiles/seed/v2/p6.png',  'image/png', 670000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8007, 'uploadedfiles/seed/v2/p7.png',  'image/png', 470000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8008, 'uploadedfiles/seed/v2/p8.png',  'image/png', 150000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8009, 'uploadedfiles/seed/v2/p9.png',  'image/png', 600000, NULL, 'clone_avatar', '2026-05-14 00:00:00'),
  (8010, 'uploadedfiles/seed/v2/p10.png', 'image/png', 380000, NULL, 'clone_avatar', '2026-05-14 00:00:00');

-- ─── 2) 유저 3명 ────────────────────────────────────────────
-- password_hash 는 phc$demo$dummy 라 실제 로그인 불가 — 데모 표시 전용.
INSERT INTO users (id, name, email, password_hash, gender, age, credits, funnel_stage, avatar_url, created_at)
VALUES
  (9001, '민수', 'minsoo@demo.afterlife',  'phc$demo$dummy', 'male', 24, 0, 'creator',
    'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:00:00'),
  (9004, '지호', 'jiho@demo.afterlife',   'phc$demo$dummy', 'male', 26, 0, 'creator',
    'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:00:00'),
  (9005, '서준', 'seojun@demo.afterlife', 'phc$demo$dummy', 'male', 22, 0, 'creator',
    'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:00:00');

-- ─── 3) 클론 7개 ────────────────────────────────────────────
-- description 에 해시태그 3개 이상 포함 (사용자 요구). interests 테이블엔 안 넣음.
INSERT INTO clones (id, owner_id, name, username, description, clone_type, visibility, training_status, avatar_url, created_at)
VALUES
  -- user 9001 의 페르소나 2개 (이미지 2, 3)
  (9002, 9001, '상혁',  'sanghyuk',   '솔로랭크 마스터, 라인전 자신있어요 💪 #LCK #미드라이너 #프로게이머',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:01:00'),
  (9003, 9001, '지훈',  'jihoon_t1',  '스크림 끝나면 라면 한 그릇이 최고죠 🍜 #카페인과다 #밤샘 #esports',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:02:00'),

  -- user 9004 의 페르소나 2개 (이미지 6, 7)
  (9006, 9004, '유나',  'yuna_music', '오늘도 좋은 하루 보내세요 ☕ #감성 #뮤지션 #일상기록',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:03:00'),
  (9007, 9004, '도현',  'dohyun_lee', '오늘도 산책이 제일 좋아 🚶 #카페투어 #브이로그 #여행스타그램',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:04:00'),

  -- user 9005 의 페르소나 3개 (이미지 8, 9, 10)
  (9008, 9005, '은우',  'eunwoo_z',   '조용한 일요일 오후 📚 #카페공부 #자기관리 #북카페',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:05:00'),
  (9009, 9005, '하준',  'hajun_park', '보드 타고 바람 가르기 🛹 #스케이트보드 #스트릿 #영화감상',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:06:00'),
  (9010, 9005, '민재',  'minjae_kim', '오늘 미팅 끝! 한잔 하러 가야지 🍷 #비즈니스 #골프 #와인',
    'friend', 'public', 'ready', 'https://edge-alt-preview.example.invalid/oth-path',
    '2026-05-14 00:07:00');

-- ─── 4) clone_stats (기본 0) ───────────────────────────────
INSERT INTO clone_stats (clone_id, followers_count, messages_count, gifts_count) VALUES
  (9002, 0, 0, 0), (9003, 0, 0, 0),
  (9006, 0, 0, 0), (9007, 0, 0, 0),
  (9008, 0, 0, 0), (9009, 0, 0, 0), (9010, 0, 0, 0);

-- ─── 5) feeds (각 클론의 첫 게시물 — description 그대로 한 번 더) ─────
-- 홈피드 discover 가 클론별 최신 피드 1건을 잡으므로, 시드 클론에도 첫 피드 박아둠.
-- 좋아요/댓글 카운트는 트리거가 자동.
INSERT INTO feeds (clone_id, content, media_url, media_type, likes_count, created_at) VALUES
  (9002, '오늘도 솔로랭크 정복! 다음 패치 기대됨 #LCK #미드라이너 #프로게이머',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:10:00'),
  (9003, '스크림 끝나고 라면 한 그릇 🍜 #카페인과다 #밤샘 #esports',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:11:00'),
  (9006, '햇살 좋은 날 ☕ #감성 #뮤지션 #일상기록',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:12:00'),
  (9007, '오늘의 카페 발견 #카페투어 #브이로그 #여행스타그램',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:13:00'),
  (9008, '오후의 책 한 권 📚 #카페공부 #자기관리 #북카페',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:14:00'),
  (9009, '주말 보드 타임 🛹 #스케이트보드 #스트릿 #영화감상',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:15:00'),
  (9010, '미팅 끝 와인 한잔 🍷 #비즈니스 #골프 #와인',
    'https://edge-alt-preview.example.invalid/oth-path', 'image', 0, '2026-05-14 00:16:00');
