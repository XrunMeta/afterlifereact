import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyTotp } from "../api/adminAuth";

export function TotpVerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onVerify() {
    setBusy(true);
    setErr(null);
    try {
      await verifyTotp(code);
      navigate("/", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>2단계 인증</h1>
        <p style={styles.note}>Authenticator 앱의 6자리 코드를 입력하세요.</p>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          style={styles.input}
          placeholder="123456"
          autoFocus
        />
        {err && <div style={styles.error}>{err}</div>}
        <button
          onClick={onVerify}
          disabled={busy || code.length !== 6}
          style={styles.button}
        >
          {busy ? "확인 중..." : "확인"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
