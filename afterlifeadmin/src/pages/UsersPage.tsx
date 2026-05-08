import { v_c4deb2, v_5ab095, type v_bb76a8 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_bf3a72 = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "탈퇴(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
};

const v_9f536f = (v_81e2ef) => {
  const v_fd5f43 = v_bf3a72[v_81e2ef ?? "active"] ?? v_bf3a72.active;
  return (
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
  );
};

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

export function v_1d1159() {
  const [v_de7ba7, v_28d82a] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_808660, v_e61149] = v_5ab095<string | null>(null);
  const [v_8d1ee1, v_90ea51] = v_5ab095<OtpLog[]>([]);
  const [v_b47642, v_eadbac] = v_5ab095(false);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921.getUsers().then(v_28d82a).catch(console.error).finally(() => v_34a50a(false));
  };

  v_c4deb2(v_f6f5de, []);

  const v_57fac2 = async (v_389afb) => {
    if (!confirm("Delete this user?")) return;
    await v_05a921.deleteUser(v_389afb);
    v_f6f5de();
  };

  const v_f6b039 = async (v_e0c7e8) => {
    v_e61149(v_e0c7e8);
    v_90ea51([]);
    v_eadbac(true);
    try {
      const v_cb35cb = await v_05a921.getOtpLogs({ email: v_e0c7e8, limit: 50 });
      v_90ea51(v_cb35cb.items);
    } catch (v_49263d) {
      console.error("getOtpLogs failed:", v_49263d);
    } finally {
      v_eadbac(false);
    }
  };

  const v_5f500c = () => {
    v_e61149(null);
    v_90ea51([]);
  };

  const v_b9fa58 = [
    { key: "id", label: "ID" },
    {
      key: "deletionState",
      label: "상태",
      render: v_9f536f,
    },
    { key: "name", label: "Name" },
    {
      key: "email",
      label: "Email",
      render: (v_81e2ef, v_3ac7e7) =>
        v_81e2ef ? (
          <button
            type="button"
            onClick={() => v_f6b039(v_81e2ef)}
            title="OTP 발송 내역 보기"
            style={v_d04939}
          >
            {v_81e2ef}
          </button>
        ) : (
          "—"
        ),
    },
    { key: "gender", label: "Gender" },
    { key: "age", label: "Age" },
    { key: "credits", label: "Credits" },
    { key: "funnelStage", label: "Funnel" },
    {
      key: "marketingConsent",
      label: "Marketing",
      render: (v_81e2ef) => (v_81e2ef ? "✓" : "—"),
    },
    {
      key: "interests",
      label: "Interests",
      render: (v_81e2ef) =>
        v_81e2ef ? <span style={{ fontSize: 12, color: "#475569" }}>{v_81e2ef}</span> : "—",
    },
    {
      key: "xrunWallet",
      label: "xrun Wallet",
      render: (v_81e2ef) =>
        v_81e2ef ? (
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v_81e2ef}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "xrunMemberId",
      label: "xrun ID",
      render: (v_81e2ef) => (v_81e2ef ? String(v_81e2ef) : "—"),
    },
    { key: "createdAt", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) ?? "" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>
      <div style={{ marginBottom: 12, color: "#64748b", fontSize: 13 }}>
        Email 셀을 클릭하면 OTP 발송 내역(최근 50건)을 볼 수 있어요.
      </div>
      <DataTable columns={v_b9fa58} data={v_de7ba7} onDelete={v_57fac2} loading={v_683210} />

      {v_808660 !== null && (
        <div style={v_d25d5c} onClick={v_5f500c}>
          <div style={v_bbf4b0} onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <div style={v_595fcc}>
              <div>
                <div style={v_dfd0c9}>OTP 발송 내역</div>
                <div style={v_08a9be}>{v_808660}</div>
              </div>
              <button type="button" onClick={v_5f500c} style={v_62349c}>
                ✕
              </button>
            </div>
            <div style={v_99cadc}>
              {v_b47642 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  Loading...
                </div>
              ) : v_8d1ee1.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  발송 내역이 없습니다.
                </div>
              ) : (
                <table style={v_f458bd}>
                  <thead>
                    <tr>
                      <th style={v_694aab}>발송 시각</th>
                      <th style={v_694aab}>코드</th>
                      <th style={v_694aab}>상태</th>
                      <th style={v_694aab}>시도</th>
                      <th style={v_694aab}>만료</th>
                      <th style={v_694aab}>인증 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v_8d1ee1.map((v_3e58a1) => {
                      const v_fd5f43 = v_7c1ed0[v_3e58a1.status] ?? v_7c1ed0.pending;
                      return (
                        <tr key={v_3e58a1.id}>
                          <td style={v_081c00}>{v_16897e(v_3e58a1.sentAt)}</td>
                          <td style={{ ...v_081c00, fontFamily: "monospace", fontWeight: 600, fontSize: 16 }}>
                            {v_3e58a1.code}
                          </td>
                          <td style={v_081c00}>
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
                          <td style={v_081c00}>{v_3e58a1.attempts}/5</td>
                          <td style={v_081c00}>{v_16897e(v_3e58a1.expiresAt)}</td>
                          <td style={v_081c00}>{v_16897e(v_3e58a1.verifiedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const otpEmailBtn: v_bb76a8 = {
  background: "transparent",
  border: "none",
  color: "#1d4ed8",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
};

const modalOverlay: v_bb76a8 = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 16,
};

const modalSheet: v_bb76a8 = {
  background: "#fff",
  borderRadius: 12,
  width: "100%",
  maxWidth: 800,
  maxHeight: "85vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
};

const modalHeader: v_bb76a8 = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
};

const modalTitle: v_bb76a8 = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

const modalEmail: v_bb76a8 = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 4,
  fontFamily: "monospace",
};

const closeBtn: v_bb76a8 = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  fontSize: 18,
  cursor: "pointer",
  padding: 4,
};

const modalBody: v_bb76a8 = {
  padding: "16px 24px 24px",
  overflowY: "auto",
};

const otpTable: v_bb76a8 = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const otpTh: v_bb76a8 = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e2e8f0",
  color: "#64748b",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const otpTd: v_bb76a8 = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};
