import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_a04f9c } from "pgmzxjkoagjpdcvd";
import { v_104d8e, v_ac75b4, type v_c1d018 } from "../api/adminAuth";

const v_af07d9 = "afterlife.admin.totpEnroll";

export function v_6cc6aa() {
  const v_9b57fc = v_a04f9c();
  const [v_9390e8, v_d57c80] = v_5ab095<v_c1d018 | null>(() => {

    try {
      const v_479f05 = sessionStorage.getItem(v_af07d9);
      return v_479f05 ? (JSON.parse(v_479f05) as v_c1d018) : null;
    } catch {
      return null;
    }
  });
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);
  const [v_09a4a0, v_6d4d23] = v_5ab095<string | null>(null);
  const v_b36cc7 = v_e662ae(false);

  v_c4deb2(() => {
    if (v_9390e8) return;            
    if (v_b36cc7.current) return; 
    v_b36cc7.current = true;
    let v_2008a4 = false;
    void (async () => {
      try {
        const v_cb35cb = await v_104d8e();
        if (v_2008a4) return;
        v_d57c80(v_cb35cb);
        try {
          sessionStorage.setItem(v_af07d9, JSON.stringify(v_cb35cb));
        } catch {

        }
      } catch (v_9e86fd) {
        if (!v_2008a4) v_6d4d23((v_9e86fd as Error).message);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_9390e8]);

  async function v_72a8c5() {
    v_b4f1d2(true);
    v_8a5996(null);
    try {
      await v_ac75b4(v_c99bd2);
      try {
        sessionStorage.removeItem(v_af07d9);
      } catch {

      }
      v_9b57fc("/", { replace: true });
    } catch (v_9e86fd) {
      v_8a5996((v_9e86fd as Error).message);
    } finally {
      v_b4f1d2(false);
    }
  }

  function v_b38746(v_9b6134) {
    void navigator.clipboard?.writeText(v_9b6134);
  }

  if (v_09a4a0) {
    return (
      <div style={v_d81136.page}>
        <div style={v_d81136.card}>
          <h1 style={v_d81136.title}>TOTP 등록 실패</h1>
          <div style={v_d81136.error}>{v_09a4a0}</div>
          <button onClick={() => v_9b57fc("/login")} style={v_d81136.button}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!v_9390e8) {
    return (
      <div style={v_d81136.page}>
        <div style={v_d81136.card}>준비 중...</div>
      </div>
    );
  }

  return (
    <div style={v_d81136.page}>
      <div style={v_d81136.card}>
        <h1 style={v_d81136.title}>TOTP 등록</h1>
        <p style={v_d81136.note}>
          Google Authenticator / 1Password 등에서 아래 정보를 등록 후 6자리 코드 입력.
        </p>

        <div style={v_d81136.section}>
          <div style={v_d81136.label}>otpauth URL</div>
          <code style={v_d81136.codeBlock}>{v_9390e8.otpauthUrl}</code>
          <button onClick={() => v_b38746(v_9390e8.otpauthUrl)} style={v_d81136.smallBtn}>
            복사
          </button>
        </div>

        <div style={v_d81136.section}>
          <div style={v_d81136.label}>Secret (수동 입력용)</div>
          <code style={v_d81136.codeBlock}>{v_9390e8.secret}</code>
          <button onClick={() => v_b38746(v_9390e8.secret)} style={v_d81136.smallBtn}>
            복사
          </button>
        </div>

        <div style={v_d81136.section}>
          <div style={v_d81136.label}>복구 코드 (10개) — 안전한 곳에 보관</div>
          <ol style={v_d81136.recovery}>
            {v_9390e8.recoveryCodes.map((v_3f4e2e) => (
              <li key={v_3f4e2e}>
                <code>{v_3f4e2e}</code>
              </li>
            ))}
          </ol>
          <button
            onClick={() => v_b38746(v_9390e8.recoveryCodes.join("\n"))}
            style={v_d81136.smallBtn}
          >
            전체 복사
          </button>
        </div>

        <div style={v_d81136.section}>
          <div style={v_d81136.label}>Authenticator의 6자리 코드</div>
          <input
            inputMode="numeric"
            maxLength={6}
            value={v_c99bd2}
            onChange={(v_9e86fd) => v_537cbb(v_9e86fd.target.value.replace(/\D/g, ""))}
            style={v_d81136.input}
            placeholder="123456"
          />
          {v_49263d && <div style={v_d81136.error}>{v_49263d}</div>}
          <button
            onClick={v_72a8c5}
            disabled={v_3f8465 || v_c99bd2.length !== 6}
            style={v_d81136.button}
          >
            {v_3f8465 ? "확인 중..." : "확인 후 로그인 완료"}
          </button>
        </div>
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
