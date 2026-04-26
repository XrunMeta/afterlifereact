import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/adminAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await login(email, password);
      navigate(r.totpEnrolled ? "/totp-verify" : "/totp-enroll", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>관리자 로그인</h1>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>
            이메일
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            비밀번호
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </label>
          {err && <div style={styles.error}>{err}</div>}
          <button type="submit" disabled={busy} style={styles.button}>
            {busy ? "로그인 중..." : "로그인"}
          </button>
        </form>
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
  title: { margin: "0 0 24px", fontSize: 20 },
  label: { display: "block", marginBottom: 16, fontSize: 14, color: "#475569" },
  input: {
    display: "block",
    width: "100%",
    marginTop: 4,
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 14,
    boxSizing: "border-box",
  },
  error: {
    marginBottom: 16,
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
