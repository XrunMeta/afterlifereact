-- 0103_emergency_notices.sql
-- 앱 최상단에 노출할 비상 공지 (긴급 점검 / 장애 안내 / 프로모션 배너 등).
--   어드민이 CRUD 로 관리, 앱은 GET /oth-path 로 활성 1건 폴링.
--   시간창(start_time/end_time)이 있으면 그 범위에서만, is_active=1 이면 즉시 활성.
--   여러 건이 동시에 활성일 경우 severity_level 이 가장 높은 항목이 우선.
--
--   시간은 unix ms (BIGINT) 로 저장. NULL 이면 "즉시 시작" / "만료 없음".
--
--   기존 emergency_contacts (상속 승계용) 와는 완전 별개 테이블 — 이름만 겹침.

CREATE TABLE IF NOT EXISTS emergency_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  severity_level INTEGER NOT NULL DEFAULT 2 CHECK (severity_level BETWEEN 1 AND 4),
  is_active INTEGER NOT NULL DEFAULT 1,
  start_time INTEGER,
  end_time INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 활성 조회 최적화 — GET /oth-path 매 요청 (앱 폴링 5분 주기)
CREATE INDEX IF NOT EXISTS idx_emergency_active
  ON emergency_notices(is_active, start_time, end_time);
