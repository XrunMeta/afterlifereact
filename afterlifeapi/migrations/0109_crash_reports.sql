-- T-220 Phase2 — 자체 크래시·에러 리포트 수집 테이블.
--   앱에서 POST /oth-path 로 스크러빙된 이벤트 저장. Sentry 대신 자체 인프라 사용.
--   auth 는 선택 — 로그인 전 크래시도 익명으로 받는다(user_id NULL 허용).
--   목적: T-211(회색화면 프리즈) 재현·원인 규명에 필요한 최소 데이터 확보.
--   보관: 최근 90일. 이후 크론(admin 별도)이 오래된 행을 삭제 예정.

CREATE TABLE IF NOT EXISTS crash_reports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER,                                 -- NULL = 익명(로그인 전)
  ts                INTEGER NOT NULL,                        -- 앱 클라이언트 timestamp (ms)
  received_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),  -- 서버 수신 시각(ms)
  is_fatal          INTEGER NOT NULL DEFAULT 0,              -- 0=warn, 1=fatal
  error_name        TEXT,                                    -- 에러 클래스명 (예: TypeError)
  message           TEXT NOT NULL,                           -- 스크럽된 에러 메시지
  stack             TEXT,                                    -- 스크럽된 스택
  screen            TEXT,                                    -- 마지막 nav breadcrumb 화면명(있으면)
  breadcrumbs_json  TEXT,                                    -- SafeBreadcrumb[] JSON (최근 40개)
  extra_json        TEXT,                                    -- scrubValue(extra) JSON
  app_version       TEXT,                                    -- expo runtimeVersion 또는 nativeAppVersion
  runtime_version   TEXT,                                    -- OTA runtimeVersion
  update_id         TEXT,                                    -- OTA updateId (재현 대응)
  channel           TEXT,                                    -- OTA channel (preview / production)
  platform          TEXT,                                    -- 'ios' | 'android'
  os_version        TEXT,                                    -- Platform.Version
  device_model      TEXT,                                    -- Device.modelName (best-effort)
  locale            TEXT,                                    -- i18n locale
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 조회 인덱스: 최근순 / user 별 / fatal 별 / 화면 별 필터에 대비.
CREATE INDEX IF NOT EXISTS idx_crash_reports_received_at ON crash_reports(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_reports_user_id     ON crash_reports(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_reports_is_fatal    ON crash_reports(is_fatal, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_reports_screen      ON crash_reports(screen, received_at DESC);
