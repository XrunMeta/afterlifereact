-- 신고 누적 조건 — 누적 경고(strike) 횟수별 벌칙을 관리자가 설정.
--   threshold: 신고 누적 횟수 (1~10, 추가 가능). action: 'warn'(경고만) | 'suspend'(활동 정지).
--   suspend_days: action='suspend' 일 때 정지 일수 (예: 7=일주일, 30=한달).
--   warn 엔드포인트가 이 규칙을 읽어 적용 → 앱(페르소나 생성 게이트)에 반영.
CREATE TABLE report_penalty_rules (
  threshold     INTEGER PRIMARY KEY,
  action        TEXT NOT NULL CHECK (action IN ('warn', 'suspend')),
  suspend_days  INTEGER,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 기본값 (관리자가 화면에서 수정/추가 가능): 1·2회 경고, 3회 한달 정지.
INSERT INTO report_penalty_rules (threshold, action, suspend_days) VALUES
  (1, 'warn', NULL),
  (2, 'warn', NULL),
  (3, 'suspend', 30);
