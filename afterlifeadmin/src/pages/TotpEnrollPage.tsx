import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { enrollTotp, verifyTotp, type TotpEnrollResult } from "../api/adminAuth";

const ENROLL_CACHE_KEY = "afterlife.admin.totpEnroll";

export function TotpEnrollPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<TotpEnrollResult | null>(() => {

    try {
      const raw = sessionStorage.getItem(ENROLL_CACHE_KEY);
      return raw ? (JSON.parse(raw) as TotpEnrollResult) : null;
    } catch {
      return null;
    }
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (data) return;            
    if (startedRef.current) return; 
    startedRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const r = await enrollTotp();
        if (cancelled) return;
        setData(r);
        try {
          sessionStorage.setItem(ENROLL_CACHE_KEY, JSON.stringify(r));
        } catch {

        }
      } catch (e) {
        if (!cancelled) setEnrollErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function onVerify() {
    setBusy(true);
    setErr(null);
    try {
      await verifyTotp(code);
      try {
        sessionStorage.removeItem(ENROLL_CACHE_KEY);
      } catch {

      }
      navigate("/", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text);
  }

  if (enrollErr) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>TOTP 등록 실패</h1>
          <div style={styles.error}>{enrollErr}</div>
          <button onClick={() => navigate("/login")} style={styles.button}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>준비 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>TOTP 등록</h1>
        <p style={styles.note}>
          Google Authenticator / 1Password 등에서 아래 정보를 등록 후 6자리 코드 입력.
        </p>

        <div style={styles.section}>
          <div style={styles.label}>otpauth URL</div>
          <code style={styles.codeBlock}>{data.otpauthUrl}</code>
          <button onClick={() => copy(data.otpauthUrl)} style={styles.smallBtn}>
            복사
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>Secret (수동 입력용)</div>
          <code style={styles.codeBlock}>{data.secret}</code>
          <button onClick={() => copy(data.secret)} style={styles.smallBtn}>
            복사
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>복구 코드 (10개) — 안전한 곳에 보관</div>
          <ol style={styles.recovery}>
            {data.recoveryCodes.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ol>
          <button
            onClick={() => copy(data.recoveryCodes.join("\n"))}
            style={styles.smallBtn}
          >
            전체 복사
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>Authenticator의 6자리 코드</div>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={styles.input}
            placeholder="123456"
          />
          {err && <div style={styles.error}>{err}</div>}
          <button
            onClick={onVerify}
            disabled={busy || code.length !== 6}
            style={styles.button}
          >
            {busy ? "확인 중..." : "확인 후 로그인 완료"}
          </button>
        </div>
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
    padding: 24,
  },
  card: {
    width: 480,
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 12px", fontSize: 20 },
  note: { margin: "0 0 24px", color: "#64748b", fontSize: 13 },
  section: { marginBottom: 20 },
  label: { fontSize: 13, color: "#475569", marginBottom: 6 },
  codeBlock: {
    display: "block",
    padding: 10,
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    fontSize: 12,
    wordBreak: "break-all",
    marginBottom: 4,
  },
  recovery: { margin: "0 0 4px 0", paddingLeft: 20, fontSize: 13 },
  input: {
    display: "block",
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 16,
    letterSpacing: 4,
    textAlign: "center",
    boxSizing: "border-box",
    marginBottom: 8,
  },
  error: {
    margin: "8px 0",
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
  smallBtn: {
    padding: "4px 10px",
    backgroundColor: "#e2e8f0",
    color: "#1e293b",
    border: "none",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
};
