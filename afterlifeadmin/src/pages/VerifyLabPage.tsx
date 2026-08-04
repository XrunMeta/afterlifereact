

const v_7f7b1d = "https://rtc.example.invalid/oth-path";

const v_e86257 = import.meta.env.VITE_VERIFY_URL ?? v_7f7b1d;

export function v_d3670a() {
  return (
    <div style={v_d81136.root}>
      <div style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>대화 트레이닝 랩</h1>
          <p style={v_d81136.desc}>
            클론 대화 LLM 검증 — L2 기억 · L2′ 화자 오버레이 · L1 지식.
            가비아 prethird 화면을 그대로 띄웁니다.
          </p>
        </div>
        <a href={v_e86257} target="_blank" rel="noreferrer" style={v_d81136.newTab}>
          새 탭으로 열기 ↗
        </a>
      </div>

      {
}
      <iframe
        src={v_e86257}
        title="클론 대화 LLM 검증"
        style={v_d81136.frame}

        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
      />

      <p style={v_d81136.note}>
        접속 주소: <code style={v_d81136.code}>{v_e86257}</code>
        {" · "}
        화면 안에서 <b>verify 비밀번호</b>를 별도로 입력해야 데이터가 조회됩니다.
      </p>
    </div>
  );
}

const v_d81136 = {

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
