-- Critical 테마 (가) D단계: super_admin 쿼럼
-- 고가치 작업(셀럽 IP 인수, 강제 하드 삭제 등)은 N명 승인 후 요청자 본인이 실행한다.
-- 요청자는 자기 요청을 승인할 수 없고(분리된 eye), 실행은 오직 요청자만.
-- 24시간 TTL. 승인 수 요건(기본 2)은 action_type별로 나중 확장 가능.

CREATE TABLE admin_quorum_requests (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type         TEXT NOT NULL,        -- 'celeb_ip_transfer' | 'force_hard_delete' | ...
  payload             TEXT NOT NULL,        -- JSON — 실행에 필요한 파라미터 스냅샷
  requested_by        INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  reason              TEXT NOT NULL,        -- 요청자 사유 (감사 추적용)
  required_approvals  INTEGER NOT NULL DEFAULT 2 CHECK (required_approvals >= 1),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','executed','rejected','expired')),
  expires_at          TIMESTAMP NOT NULL,   -- 생성 시 +24h
  executed_at         TIMESTAMP,
  rejected_at         TIMESTAMP,
  reject_reason       TEXT,
  execution_result    TEXT,                 -- JSON — 실행 결과 요약 (성공/실패)
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_quorum_req_status ON admin_quorum_requests(status, expires_at);
CREATE INDEX idx_admin_quorum_req_requester ON admin_quorum_requests(requested_by, created_at);

-- 승인/거부 기록. 동일 admin의 이중 투표는 UNIQUE로 차단.
CREATE TABLE admin_quorum_approvals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id     INTEGER NOT NULL REFERENCES admin_quorum_requests(id) ON DELETE CASCADE,
  admin_user_id  INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  decision       TEXT NOT NULL CHECK (decision IN ('approve','reject')),
  comment        TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, admin_user_id)
);

CREATE INDEX idx_admin_quorum_approvals_req ON admin_quorum_approvals(request_id, decision);
