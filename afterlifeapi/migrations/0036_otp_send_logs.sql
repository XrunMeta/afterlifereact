-- otp_send_logs — 회원가입/로그인용 OTP 발송 내역.
-- 어드민 페이지(QA/디버그) 에서 코드 평문 + 발송 시각 + 검증 상태 확인.
-- 보안 주의: 평문 OTP 가 저장됨. 어드민 인증 + RBAC 로 접근 제한.

CREATE TABLE otp_send_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,                     -- 6자리 평문
  sent_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  -- pending: 발송됨, 미검증
  -- verified: 사용자가 옳게 입력 → 통과
  -- expired: 만료
  -- exhausted: 5회 오답으로 폐기
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'verified', 'expired', 'exhausted')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMP
);

CREATE INDEX idx_otp_send_logs_email_sent ON otp_send_logs(email, sent_at DESC);
CREATE INDEX idx_otp_send_logs_sent ON otp_send_logs(sent_at DESC);
