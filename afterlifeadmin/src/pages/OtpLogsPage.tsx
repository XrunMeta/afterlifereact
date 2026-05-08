import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { api } from "../api/client";

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

export function OtpLogsPage() {
  const [logs, setLogs] = useState<OtpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [limit, setLimit] = useState(100);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getOtpLogs({ email: appliedEmail || undefined, limit })
      .then((r) => setLogs(r.items))
      .catch((err) => {
        console.error("getOtpLogs failed:", err);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [appliedEmail, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const onApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedEmail(emailFilter.trim().toLowerCase());
  };

  const onClearFilter = () => {
    setEmailFilter("");
    setAppliedEmail("");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>OTP 발송 내역</h1>
      <div style={{ marginBottom: 24, color: "#64748b", fontSize: 13 }}>
        회원가입/로그인용 이메일 OTP 발송 기록. 평문 코드 노출 — 어드민 RBAC 가 유일한 보호선.
      </div>

      <form onSubmit={onApplyFilter} style={filterRow}>
        <input
          type="email"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          placeholder="이메일로 필터 (예: foo@example.com)"
          style={emailInput}
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={limitSelect}
        >
          <option value={50}>50건</option>
          <option value={100}>100건</option>
          <option value={200}>200건</option>
        </select>
        <button type="submit" style={primaryBtn}>
          필터
        </button>
        <button type="button" onClick={onClearFilter} style={ghostBtn}>
          전체보기
        </button>
        <button type="button" onClick={load} style={ghostBtn}>
          새로고침
        </button>
        <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
          총 {logs.length}건
          {appliedEmail && (
            <span style={{ marginLeft: 8 }}>
              (필터: <code style={emailFilterChip}>{appliedEmail}</code>)
            </span>
          )}
        </div>
      </form>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>발송 시각</th>
              <th style={th}>이메일</th>
              <th style={th}>코드</th>
              <th style={th}>상태</th>
              <th style={th}>시도</th>
              <th style={th}>만료</th>
              <th style={th}>인증 시각</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={emptyTd}>
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyTd}>
                  발송 내역이 없습니다.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const s = OTP_STATUS_LABEL[log.status] ?? OTP_STATUS_LABEL.pending;
                return (
                  <tr key={log.id}>
                    <td style={td}>{formatDateTime(log.sentAt)}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>
                      {log.email}
                    </td>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
                      {log.code}
                    </td>
                    <td style={td}>
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
                    <td style={td}>{log.attempts}/5</td>
                    <td style={td}>{formatDateTime(log.expiresAt)}</td>
                    <td style={td}>{formatDateTime(log.verifiedAt)}</td>
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

const filterRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  flexWrap: "wrap",
};

const emailInput: CSSProperties = {
  flex: "0 1 320px",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
};

const limitSelect: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
};

const primaryBtn: CSSProperties = {
  padding: "8px 14px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  padding: "8px 14px",
  background: "#fff",
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const emailFilterChip: CSSProperties = {
  fontFamily: "monospace",
  background: "#f1f5f9",
  padding: "1px 6px",
  borderRadius: 4,
};

const tableWrap: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  overflow: "auto",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "2px solid #e2e8f0",
  color: "#64748b",
  fontWeight: 600,
  whiteSpace: "nowrap",
  background: "#f8fafc",
};

const td: CSSProperties = {
  padding: "10px 16px",
  borderBottom: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};

const emptyTd: CSSProperties = {
  ...td,
  textAlign: "center",
  color: "#94a3b8",
  padding: "32px 16px",
};
