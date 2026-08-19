

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { api } from "../api/client";
import {
  REPORT_REASONS,
  SEVERITY_COLORS,
  severityForReason,
  isPresetReason,
} from "../utils/reportReasons";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "신고 접수", color: "#b91c1c", bg: "#fee2e2" },
  reviewed: { label: "검토 완료", color: "#15803d", bg: "#dcfce7" },
  dismissed: { label: "기각", color: "#64748b", bg: "#f1f5f9" },
};

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface Report {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string;
  cloneId: number;
  cloneName: string;
  cloneUsername: string;
  cloneOwnerId: number;
  cloneOwnerName: string | null;
  cloneOwnerEmail: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [limit, setLimit] = useState(100);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getCloneReports({
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
        limit,
      })
      .then((r) => setReports(r.items))
      .catch((err) => {
        console.error("getCloneReports failed:", err);
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, reasonFilter, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports</h1>
          <p style={styles.sub}>페르소나 신고 기록</p>
        </div>
        <div style={styles.toolbar}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">전체 상태</option>
            <option value="open">신고 접수</option>
            <option value="reviewed">검토 완료</option>
            <option value="dismissed">기각</option>
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">전체 사유</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="__empty__">사유 없음</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={styles.select}
          >
            <option value={50}>50건</option>
            <option value={100}>100건</option>
            <option value={200}>200건</option>
            <option value={500}>500건</option>
          </select>
          <button onClick={load} style={styles.refreshBtn}>새로고침</button>
        </div>
      </header>

      {loading ? (
        <p>로딩 중...</p>
      ) : reports.length === 0 ? (
        <div style={styles.empty}>신고 기록이 없습니다.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>신고자</th>
                <th style={styles.th}>신고된 페르소나</th>
                <th style={styles.th}>페르소나 소유자</th>
                <th style={styles.th}>사유</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const status = STATUS_LABEL[r.status] ?? {
                  label: r.status,
                  color: "#1e293b",
                  bg: "#f1f5f9",
                };
                return (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>
                      <div style={styles.cellMain}>{r.userName ?? "—"}</div>
                      <div style={styles.cellSub}>{r.userEmail}</div>
                      <div style={styles.cellSub}>id: {r.userId}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellMain}>{r.cloneName}</div>
                      <div style={styles.cellSub}>@{r.cloneUsername}</div>
                      <div style={styles.cellSub}>id: {r.cloneId}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellMain}>{r.cloneOwnerName ?? "—"}</div>
                      <div style={styles.cellSub}>{r.cloneOwnerEmail ?? ""}</div>
                      <div style={styles.cellSub}>id: {r.cloneOwnerId}</div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: 240 }}>
                      {r.reason ? (() => {
                        const sev = SEVERITY_COLORS[severityForReason(r.reason)];
                        const preset = isPresetReason(r.reason);
                        return (
                          <span
                            style={{
                              ...styles.reasonBadge,
                              color: sev.color,
                              backgroundColor: sev.bg,
                              borderColor: sev.border,
                            }}
                            title={preset ? "프리셋 사유" : "커스텀 사유 (자유텍스트)"}
                          >
                            {r.reason}
                          </span>
                        );
                      })() : (
                        <span style={styles.cellSub}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          color: status.color,
                          backgroundColor: status.bg,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellMain}>{formatDateTime(r.createdAt)}</div>
                      {r.reviewedAt && (
                        <div style={styles.cellSub}>
                          검토: {formatDateTime(r.reviewedAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 24, color: "#0f172a" },
  sub: { margin: "4px 0 0", color: "#64748b", fontSize: 13 },
  toolbar: { display: "flex", gap: 8, alignItems: "center" },
  select: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 13,
    backgroundColor: "#fff",
  },
  refreshBtn: {
    padding: "8px 14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
  },
  tableWrap: {
    backgroundColor: "#fff",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { backgroundColor: "#f8fafc" },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 12,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #e2e8f0",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px", fontSize: 13, color: "#0f172a", verticalAlign: "top" },
  cellMain: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  cellSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  reason: { fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" },
  reasonBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid",
    lineHeight: 1.4,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },
};
