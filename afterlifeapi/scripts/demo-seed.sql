-- Demo seed for admin preview (dev only).
-- Idempotent: removes demo rows by email/username pattern, then re-inserts.
-- Run: wrangler d1 execute afterlife-db --local --file=scripts/demo-seed.sql

DELETE FROM messages WHERE session_id LIKE 'demo-%';
DELETE FROM clones   WHERE id BETWEEN 2001 AND 2099;
DELETE FROM users    WHERE id BETWEEN 1001 AND 1099;

INSERT INTO users (id, name, email, password_hash, gender, age, credits, funnel_stage, created_at) VALUES
  (1001, 'Hizuki Demo', 'hizuki@demo.afterlife', 'phc$demo$dummy', 'female', 27, 1200, 'creator',  '2026-04-01 10:00:00'),
  (1002, 'Kuro Demo',   'kuro@demo.afterlife',   'phc$demo$dummy', 'other',  31,  850, 'returnee', '2026-04-02 11:00:00'),
  (1003, 'Mei Demo',    'mei@demo.afterlife',    'phc$demo$dummy', 'female', 24,   50, 'explorer', '2026-04-05 09:00:00'),
  (1004, 'Ryo Demo',    'ryo@demo.afterlife',    'phc$demo$dummy', 'male',   36,  320, 'returnee', '2026-04-08 14:00:00'),
  (1005, 'Ako Demo',    'ako@demo.afterlife',    'phc$demo$dummy', 'female', 19,    0, 'explorer', '2026-04-10 18:00:00'),
  (1006, 'Jin Demo',    'jin@demo.afterlife',    'phc$demo$dummy', 'male',   42, 4200, 'creator',  '2026-04-12 08:00:00');

INSERT INTO clones (id, owner_id, name, username, description, clone_type, visibility, training_status, created_at) VALUES
  (2001, 1001, 'Hizuki Mentor', 'demo_hizuki_mentor', 'Demo mentor clone', 'mentor', 'public',    'ready',   '2026-04-03 10:00:00'),
  (2002, 1001, 'Hizuki MemLow', 'demo_hizuki_memlow', 'Demo memlow clone', 'memlow', 'private',   'ready',   '2026-04-03 11:00:00'),
  (2003, 1002, 'Kuro Friend',   'demo_kuro_friend',   'Demo friend clone', 'friend', 'public',    'ready',   '2026-04-04 10:00:00'),
  (2004, 1003, 'Mei Celeb',     'demo_mei_celeb',     'Demo celeb clone',  'celeb',  'followers', 'pending', '2026-04-06 14:00:00'),
  (2005, 1004, 'Ryo Mentor',    'demo_ryo_mentor',    'Demo mentor clone', 'mentor', 'public',    'ready',   '2026-04-09 08:00:00'),
  (2006, 1006, 'Jin Celeb',     'demo_jin_celeb',     'Demo celeb clone',  'celeb',  'public',    'ready',   '2026-04-13 09:00:00');

INSERT INTO messages (clone_id, user_id, session_id, role, content, status, created_at) VALUES
  (2001, 1001, 'demo-c2001-1', 'user',  '안녕? 첫 데모 메시지', 'active', '2026-04-15 10:00:00'),
  (2001, 1001, 'demo-c2001-1', 'clone', '안녕! 무엇을 도와줄까?',  'active', '2026-04-15 10:01:00'),
  (2002, 1001, 'demo-c2002-1', 'user',  '오늘 기분이 좀 안 좋아', 'active', '2026-04-15 10:10:00'),
  (2002, 1001, 'demo-c2002-1', 'clone', '괜찮아, 천천히 얘기해줘.', 'active', '2026-04-15 10:11:00'),
  (2003, 1002, 'demo-c2003-1', 'user',  '쿠로 친구야, 잘 지내?',  'active', '2026-04-15 10:20:00'),
  (2003, 1002, 'demo-c2003-1', 'clone', '잘 지내! 너는?',         'active', '2026-04-15 10:21:00'),
  (2004, 1003, 'demo-c2004-1', 'user',  '셀럽 클론, 사인 받고 싶어!', 'active', '2026-04-15 10:30:00'),
  (2004, 1003, 'demo-c2004-1', 'clone', '하트 사인 보낼게~',         'active', '2026-04-15 10:31:00'),
  (2005, 1004, 'demo-c2005-1', 'user',  '커리어 조언 줄래?',          'active', '2026-04-15 10:40:00'),
  (2005, 1004, 'demo-c2005-1', 'clone', '강점 3가지부터 정리해보자.', 'active', '2026-04-15 10:41:00'),
  (2006, 1006, 'demo-c2006-1', 'user',  '최근 활동 알려줘',           'active', '2026-04-15 10:50:00'),
  (2006, 1006, 'demo-c2006-1', 'clone', '신곡 발매와 라이브 공지가 있어!', 'active', '2026-04-15 10:51:00');
