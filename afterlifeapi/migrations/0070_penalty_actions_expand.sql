-- 0070: 신고 누적 벌칙 액션 확장.
--   기존 'warn' | 'suspend' → 5종으로:
--     warn               경고만
--     clone_deactivate   해당 페르소나 비활성화 (숨김, 관리자가 복구 가능)
--     clone_delete       해당 페르소나 삭제 (soft_deleted_at 기록 → 크론이 영구 삭제로 진행)
--     clone_create_ban   페르소나 생성 금지 (suspend_days 일간) — 기존 'suspend'
--     account_ban        계정 사용 금지 (suspend_days 일간, 로그인 차단)
--   suspend_days: ban 계열일 때 기간(일). deactivate/delete/warn 은 NULL.
--
-- SQLite 는 CHECK 변경이 불가 → 테이블 재생성 후 데이터 이관('suspend'→'clone_create_ban').

ALTER TABLE report_penalty_rules RENAME TO report_penalty_rules_old;

CREATE TABLE report_penalty_rules (
  threshold     INTEGER PRIMARY KEY,
  action        TEXT NOT NULL CHECK (action IN
                  ('warn','clone_deactivate','clone_delete','clone_create_ban','account_ban')),
  suspend_days  INTEGER,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO report_penalty_rules (threshold, action, suspend_days, updated_at)
  SELECT threshold,
         CASE WHEN action = 'suspend' THEN 'clone_create_ban' ELSE action END,
         suspend_days,
         updated_at
    FROM report_penalty_rules_old;

DROP TABLE report_penalty_rules_old;

-- 계정 사용 금지 기한 (로그인 차단). NULL = 정상. 미래 시각이면 로그인 차단.
ALTER TABLE users ADD COLUMN banned_until TIMESTAMP;
