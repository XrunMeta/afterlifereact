-- 0105: T-203 관리자 클론 "비활성화(일시 중지)" 상태 컬럼 신설.
--
-- 요구사항: 비활성화는 삭제(deletion_state)와 다른 상태여야 한다 — 외부 노출은
-- 막되 소유자에게는 계속 보이고 복구가 자유로운 중간 단계. deletion_state CHECK
-- ('active'/'soft_deleted'/'archived_cold'/'hard_deleted') 는 users/messages 와
-- 공유하고 T-201 이 같은 컬럼의 단일 판정 로직을 정합화한 직후라, enum 확장 대신
-- deletion_state 와 직교(orthogonal)하는 새 컬럼을 추가한다.
--
-- admin_suspended_at  : NULL = 정상, NOT NULL = 관리자가 일시 중지한 시각.
-- admin_suspend_reason: 중지 사유(현재 상태 주석용, 복구 시 NULL 로 클리어됨).
--                        영구 감사 기록은 decryption_audit_log(0106) 에 별도 남는다.
--
-- deletion_state='active' 인 클론만 중지 대상 — 이미 soft_deleted/archived_cold/
-- hard_deleted 인 클론을 중지하는 것은 의미가 없어 애플리케이션 레벨에서 막는다
-- (admin.ts POST /oth-path 참고).

ALTER TABLE clones ADD COLUMN admin_suspended_at TIMESTAMP;
ALTER TABLE clones ADD COLUMN admin_suspend_reason TEXT;

-- idx_clones_admin_suspended: adminData.ts GET /oth-path 의 "정지된 클론만 보기"
-- 필터(suspended=1 → WHERE admin_suspended_at IS NOT NULL)가 실제 소비처. 정지 행
-- 비율이 낮을 것으로 예상돼 partial index 로 좁혀도 쓰기 비용은 무시할 수준.
CREATE INDEX idx_clones_admin_suspended ON clones(admin_suspended_at)
  WHERE admin_suspended_at IS NOT NULL;
