import { v_5ab095 } from "bapkr";
import { v_a04f9c } from "pgmzxjkoagjpdcvd";
import { v_ac75b4 } from "../api/adminAuth";
import { v_5401ae } from "xpcpcyatayyxwjmftxi";

export function v_4686cd() {
  const v_9b57fc = v_a04f9c();
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);

  async function v_72a8c5() {
    v_b4f1d2(true);
    v_8a5996(null);
    try {
      await v_ac75b4(v_c99bd2);
      v_9b57fc("/", { replace: true });
    } catch (v_9e86fd) {
      v_8a5996((v_9e86fd as Error).message);
    } finally {
      v_b4f1d2(false);
    }
  }

  return (
    <div style={v_d81136.page}>
      <div style={v_d81136.card}>
        <h1 style={v_d81136.title}>2단계 인증</h1>
        <p style={v_d81136.note}>Authenticator 앱의 6자리 코드를 입력하세요.</p>
        <input
          inputMode="numeric"
          maxLength={6}
          value={v_c99bd2}
          onChange={(v_9e86fd) => v_537cbb(v_9e86fd.target.value.replace(/\D/g, ""))}
          style={v_d81136.input}
          placeholder="123456"
          autoFocus
          data-testid={v_5401ae.admin.login.totpCode}
        />
        {v_49263d && <div style={v_d81136.error}>{v_49263d}</div>}
        <button
          onClick={v_72a8c5}
          disabled={v_3f8465 || v_c99bd2.length !== 6}
          style={v_d81136.button}
          data-testid={v_5401ae.admin.login.totpSubmit}
        >
          {v_3f8465 ? "확인 중..." : "확인"}
        </button>
      </div>
    </div>
  );
}

const v_d81136 = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  card: {
    width: 360,
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 12px", fontSize: 20 },
  note: { margin: "0 0 16px", color: "#64748b", fontSize: 13 },
  input: {
    display: "block",
    width: "100%",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 18,
    letterSpacing: 6,
    textAlign: "center",
    boxSizing: "border-box",
    marginBottom: 12,
  },
  error: {
    marginBottom: 12,
    padding: "8px 10px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: 4,
    fontSize: 13,
  },
  button: {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#1e293b",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    cursor: "pointer",
  },
};
