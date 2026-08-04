

const DEFAULT_VERIFY_URL = "https://rtc.example.invalid/oth-path";

const VERIFY_URL: string = import.meta.env.VITE_VERIFY_URL ?? DEFAULT_VERIFY_URL;

export function VerifyLabPage() {
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>대화 트레이닝 랩</h1>
          <p style={styles.desc}>
            클론 대화 LLM 검증 — L2 기억 · L2′ 화자 오버레이 · L1 지식.
            가비아 prethird 화면을 그대로 띄웁니다.
          </p>
        </div>
        <a href={VERIFY_URL} target="_blank" rel="noreferrer" style={styles.newTab}>
          새 탭으로 열기 ↗
        </a>
      </div>

      {
}
      <iframe
        src={VERIFY_URL}
        title="클론 대화 LLM 검증"
        style={styles.frame}

        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
      />

      <p style={styles.note}>
        접속 주소: <code style={styles.code}>{VERIFY_URL}</code>
        {" · "}
        화면 안에서 <b>verify 비밀번호</b>를 별도로 입력해야 데이터가 조회됩니다.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {

  root: {
    margin: "-24px -32px",
    padding: "16px 20px 12px",
    display: "flex",
    flexDirection: "column",

    minHeight: "calc(100vh - 28px)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" },
  desc: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  newTab: {
    flexShrink: 0,
    fontSize: 13,
    color: "#2563eb",
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "6px 12px",
    backgroundColor: "#fff",
    whiteSpace: "nowrap",
  },
  frame: {
    flex: 1,
    width: "100%",
    minHeight: 600,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  note: { fontSize: 12, color: "#94a3b8", margin: "8px 0 0" },
  code: { fontFamily: "ui-monospace, monospace", fontSize: 11 },
};
