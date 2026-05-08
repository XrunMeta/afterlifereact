import { v_c4deb2, v_5ab095, v_de06a3, type v_bb76a8, type v_f0e313 } from "bapkr";
import { v_05a921 } from "../api/client";

const v_7c1ed0 = {
  pending: { label: "대기중", color: "#1d4ed8", bg: "#dbeafe" },
  verified: { label: "인증완료", color: "#15803d", bg: "#dcfce7" },
  expired: { label: "만료", color: "#64748b", bg: "#f1f5f9" },
  exhausted: { label: "오답한도초과", color: "#b91c1c", bg: "#fee2e2" },
};

const v_16897e = (v_6fc191): string => {
  if (!v_6fc191) return "—";
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return v_6fc191;
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}:${v_3ee5fb(v_d5dda0.getSeconds())}`;
};

interface OtpLog {
  id: number;
  email: string;
  code: string;
  sentAt: string;
  expiresAt: string;
  status: "pending" | "verified" | "expired" | "exhausted";
  attempts: number;
  verifiedAt: string | null;
}

export function v_20683c() {
  const [v_056206, v_a67282] = v_5ab095<OtpLog[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_07613a, v_70b514] = v_5ab095("");
  const [v_a3610c, v_792136] = v_5ab095("");
  const [v_02be30, v_02c883] = v_5ab095(100);

  const v_f6f5de = v_de06a3(() => {
    v_34a50a(true);
    v_05a921
      .getOtpLogs({ email: v_a3610c || undefined, limit: v_02be30 })
      .then((v_cb35cb) => v_a67282(v_cb35cb.items))
      .catch((v_49263d) => {
        console.error("getOtpLogs failed:", v_49263d);
        v_a67282([]);
      })
      .finally(() => v_34a50a(false));
  }, [v_a3610c, v_02be30]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_15fbd5 = (e: v_f0e313) => {
    v_9e86fd.preventDefault();
    v_792136(v_07613a.trim().toLowerCase());
  };

  const v_516880 = () => {
    v_70b514("");
    v_792136("");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>OTP 발송 내역</h1>
      <div style={{ marginBottom: 24, color: "#64748b", fontSize: 13 }}>
        회원가입/로그인용 이메일 OTP 발송 기록. 평문 코드 노출 — 어드민 RBAC 가 유일한 보호선.
      </div>

      <form onSubmit={v_15fbd5} style={v_fd7a1b}>
        <input
          type="email"
          value={v_07613a}
          onChange={(v_9e86fd) => v_70b514(v_9e86fd.target.value)}
          placeholder="이메일로 필터 (예: foo@example.com)"
          style={v_ae1ce0}
        />
        <select
          value={v_02be30}
          onChange={(v_9e86fd) => v_02c883(Number(v_9e86fd.target.value))}
          style={v_91bca4}
        >
          <option value={50}>50건</option>
          <option value={100}>100건</option>
          <option value={200}>200건</option>
        </select>
        <button type="submit" style={v_7658ab}>
          필터
        </button>
        <button type="button" onClick={v_516880} style={v_592060}>
          전체보기
        </button>
        <button type="button" onClick={v_f6f5de} style={v_592060}>
          새로고침
        </button>
        <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
          총 {v_056206.length}건
          {v_a3610c && (
            <span style={{ marginLeft: 8 }}>
              (필터: <code style={v_788227}>{v_a3610c}</code>)
            </span>
          )}
        </div>
      </form>

      <div style={v_a20a14}>
        <table style={v_cb9428}>
          <thead>
            <tr>
              <th style={v_3018ef}>발송 시각</th>
              <th style={v_3018ef}>이메일</th>
              <th style={v_3018ef}>코드</th>
              <th style={v_3018ef}>상태</th>
              <th style={v_3018ef}>시도</th>
              <th style={v_3018ef}>만료</th>
              <th style={v_3018ef}>인증 시각</th>
            </tr>
          </thead>
          <tbody>
            {v_683210 ? (
              <tr>
                <td colSpan={7} style={v_597dc0}>
                  Loading...
                </td>
              </tr>
            ) : v_056206.length === 0 ? (
              <tr>
                <td colSpan={7} style={v_597dc0}>
                  발송 내역이 없습니다.
                </td>
              </tr>
            ) : (
              v_056206.map((v_3e58a1) => {
                const v_fd5f43 = v_7c1ed0[v_3e58a1.status] ?? v_7c1ed0.pending;
                return (
                  <tr key={v_3e58a1.id}>
                    <td style={v_083191}>{v_16897e(v_3e58a1.sentAt)}</td>
                    <td style={{ ...v_083191, fontFamily: "monospace", fontSize: 12 }}>
                      {v_3e58a1.email}
                    </td>
                    <td style={{ ...v_083191, fontFamily: "monospace", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
                      {v_3e58a1.code}
                    </td>
                    <td style={v_083191}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: v_fd5f43.color,
                          background: v_fd5f43.bg,
                        }}
                      >
                        {v_fd5f43.label}
                      </span>
                    </td>
                    <td style={v_083191}>{v_3e58a1.attempts}/5</td>
                    <td style={v_083191}>{v_16897e(v_3e58a1.expiresAt)}</td>
                    <td style={v_083191}>{v_16897e(v_3e58a1.verifiedAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const filterRow: v_bb76a8 = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  flexWrap: "wrap",
};

const emailInput: v_bb76a8 = {
  flex: "0 1 320px",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
};

const limitSelect: v_bb76a8 = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
};

const primaryBtn: v_bb76a8 = {
  padding: "8px 14px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtn: v_bb76a8 = {
  padding: "8px 14px",
  background: "#fff",
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const emailFilterChip: v_bb76a8 = {
  fontFamily: "monospace",
  background: "#f1f5f9",
  padding: "1px 6px",
  borderRadius: 4,
};

const tableWrap: v_bb76a8 = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  overflow: "auto",
};

const table: v_bb76a8 = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th: v_bb76a8 = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "2px solid #e2e8f0",
  color: "#64748b",
  fontWeight: 600,
  whiteSpace: "nowrap",
  background: "#f8fafc",
};

const td: v_bb76a8 = {
  padding: "10px 16px",
  borderBottom: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};

const emptyTd: v_bb76a8 = {
  ...v_083191,
  textAlign: "center",
  color: "#94a3b8",
  padding: "32px 16px",
};
