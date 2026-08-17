import { v_5ab095, type v_f0e313 } from "bapkr";
import { v_a04f9c } from "pgmzxjkoagjpdcvd";
import { v_182fdb } from "../api/adminAuth";
import { v_5401ae } from "xpcpcyatayyxwjmftxi";

export function v_f913c9() {
  const v_9b57fc = v_a04f9c();
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);

  async function v_3bfe4c(e: v_f0e313) {
    v_9e86fd.preventDefault();
    v_b4f1d2(true);
    v_8a5996(null);
    try {
      const v_cb35cb = await v_182fdb(v_e0c7e8, v_adc076);
      v_9b57fc(v_cb35cb.totpEnrolled ? "/totp-verify" : "/totp-enroll", { replace: true });
    } catch (v_9e86fd) {
      v_8a5996((v_9e86fd as Error).message);
    } finally {
      v_b4f1d2(false);
    }
  }

  return (
    <div style={v_d81136.page}>
      <div style={v_d81136.card}>
        <h1 style={v_d81136.title}>관리자 로그인</h1>
        <form onSubmit={v_3bfe4c}>
          <label style={v_d81136.label}>
            이메일
            <input
              type="email"
              required
              autoComplete="email"
              value={v_e0c7e8}
              onChange={(v_9e86fd) => v_fedf34(v_9e86fd.target.value)}
              style={v_d81136.input}
              data-testid={v_5401ae.admin.login.email}
            />
          </label>
          <label style={v_d81136.label}>
            비밀번호
            <input
              type="password"
              required
              autoComplete="current-password"
              value={v_adc076}
              onChange={(v_9e86fd) => v_52b279(v_9e86fd.target.value)}
              style={v_d81136.input}
              data-testid={v_5401ae.admin.login.password}
            />
          </label>
          {v_49263d && <div style={v_d81136.error}>{v_49263d}</div>}
          <button
            type="submit"
            disabled={v_3f8465}
            style={v_d81136.button}
            data-testid={v_5401ae.admin.login.submit}
          >
            {v_3f8465 ? "로그인 중..." : "로그인"}
          </button>
        </form>
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
