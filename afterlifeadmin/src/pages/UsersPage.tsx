import { useEffect, useState, type CSSProperties } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const DELETION_STATE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },

  soft_deleted: { label: "탈퇴", color: "#b45309", bg: "#fef3c7" },
  archived_cold: { label: "탈퇴", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "탈퇴(영구삭제)", color: "#b91c1c", bg: "#fee2e2" },
};

const renderDeletionState = (v?: string) => {
  const s = DELETION_STATE_LABEL[v ?? "active"] ?? DELETION_STATE_LABEL.active;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
      }}
    >
      {s.label}
    </span>
  );
};

const OTP_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "대기중", color: "#1d4ed8", bg: "#dbeafe" },
  verified: { label: "인증완료", color: "#15803d", bg: "#dcfce7" },
  expired: { label: "만료", color: "#64748b", bg: "#f1f5f9" },
  exhausted: { label: "오답한도초과", color: "#b91c1c", bg: "#fee2e2" },
};

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpLogs, setOtpLogs] = useState<OtpLog[]>([]);
  const [otpLoading, setOtpLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await api.deleteUser(id);
    load();
  };

  const openOtpLogs = async (email: string) => {
    setOtpEmail(email);
    setOtpLogs([]);
    setOtpLoading(true);
    try {
      const r = await api.getOtpLogs({ email, limit: 50 });
      setOtpLogs(r.items);
    } catch (err) {
      console.error("getOtpLogs failed:", err);
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpLogs = () => {
    setOtpEmail(null);
    setOtpLogs([]);
  };

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "deletionState",
      label: "상태",
      render: renderDeletionState,
    },
    { key: "name", label: "Name" },
    {
      key: "email",
      label: "Email",
      render: (v: string | undefined) =>
        v ? (
          <button
            type="button"
            onClick={() => openOtpLogs(v)}
            title="OTP 발송 내역 보기"
            style={otpEmailBtn}
          >
            {v}
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
      render: (v?: number) => (v ? "✓" : "—"),
    },
    {
      key: "interests",
      label: "Interests",
      render: (v?: string | null) =>
        v ? <span style={{ fontSize: 12, color: "#475569" }}>{v}</span> : "—",
    },
    {
      key: "xrunWallet",
      label: "xrun Wallet",
      render: (v?: string | null) =>
        v ? (
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "xrunMemberId",
      label: "xrun ID",
      render: (v?: number | null) => (v ? String(v) : "—"),
    },
    { key: "createdAt", label: "Created", render: (v?: string) => v?.slice(0, 10) ?? "" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>
      <div style={{ marginBottom: 12, color: "#64748b", fontSize: 13 }}>
        Email 셀을 클릭하면 OTP 발송 내역(최근 50건)을 볼 수 있어요.
      </div>
      <DataTable columns={columns} data={users} onDelete={handleDelete} loading={loading} />

      {otpEmail !== null && (
        <div style={modalOverlay} onClick={closeOtpLogs}>
          <div style={modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <div style={modalTitle}>OTP 발송 내역</div>
                <div style={modalEmail}>{otpEmail}</div>
              </div>
              <button type="button" onClick={closeOtpLogs} style={closeBtn}>
                ✕
              </button>
            </div>
            <div style={modalBody}>
              {otpLoading ? (
                <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  Loading...
                </div>
              ) : otpLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  발송 내역이 없습니다.
                </div>
              ) : (
                <table style={otpTable}>
                  <thead>
                    <tr>
                      <th style={otpTh}>발송 시각</th>
                      <th style={otpTh}>코드</th>
                      <th style={otpTh}>상태</th>
                      <th style={otpTh}>시도</th>
                      <th style={otpTh}>만료</th>
                      <th style={otpTh}>인증 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otpLogs.map((log) => {
                      const s = OTP_STATUS_LABEL[log.status] ?? OTP_STATUS_LABEL.pending;
                      return (
                        <tr key={log.id}>
                          <td style={otpTd}>{formatDateTime(log.sentAt)}</td>
                          <td style={{ ...otpTd, fontFamily: "monospace", fontWeight: 600, fontSize: 16 }}>
                            {log.code}
                          </td>
                          <td style={otpTd}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                                color: s.color,
                                background: s.bg,
                              }}
                            >
                              {s.label}
                            </span>
                          </td>
                          <td style={otpTd}>{log.attempts}/5</td>
                          <td style={otpTd}>{formatDateTime(log.expiresAt)}</td>
                          <td style={otpTd}>{formatDateTime(log.verifiedAt)}</td>
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

const otpEmailBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#1d4ed8",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
};

const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 16,
};

const modalSheet: CSSProperties = {
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

const modalHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
};

const modalTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
};

const modalEmail: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 4,
  fontFamily: "monospace",
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  fontSize: 18,
  cursor: "pointer",
  padding: 4,
};

const modalBody: CSSProperties = {
  padding: "16px 24px 24px",
  overflowY: "auto",
};

const otpTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const otpTh: CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e2e8f0",
  color: "#64748b",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const otpTd: CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};
