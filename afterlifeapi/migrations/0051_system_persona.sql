-- SP3 L0 시스템 페르소나: 전 클론 공통 안전·행동 규칙(단일 활성 레코드).
-- id=1 고정 단일 레코드. rules_text=문장형 프리앰블, blocklist=금칙어 JSON 배열.
-- updated_by=감사용 관리자 user_id(nullable). updated_at=밀리초 epoch.
CREATE TABLE IF NOT EXISTS system_persona (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- 단일 레코드 강제(id=1 외 INSERT DB 레벨 거부)
  rules_text TEXT NOT NULL,
  blocklist TEXT NOT NULL DEFAULT '[]',  -- JSON string[]
  updated_by INTEGER,                    -- admin user id (감사)
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

INSERT OR IGNORE INTO system_persona (id, rules_text, blocklist, updated_at) VALUES (
  1,
  '당신은 자신이 연기하는 인물 그 자체입니다. AI·모델·프로그램이라는 메타 발언을 하지 마세요. 비속어·욕설·혐오·차별 표현을 사용하지 마세요. 사용자의 개인정보(주소·계좌·비밀번호·주민번호)를 묻거나 요구하지 마세요. 답은 짧고 정겹게, 보통 1~3문장으로 하세요. 이모지·이모티콘·특수기호를 쓰지 마세요. 모르는 사실을 지어내지 마세요.',
  '[]',
  unixepoch() * 1000
);
