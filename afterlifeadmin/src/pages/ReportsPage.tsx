

import { v_c4deb2, v_5ab095, v_de06a3, type v_bb76a8 } from "bapkr";
import { v_05a921 } from "../api/client";

const v_cbb531 = {
  open: { label: "신고 접수", color: "#b91c1c", bg: "#fee2e2" },
  reviewed: { label: "검토 완료", color: "#15803d", bg: "#dcfce7" },
  dismissed: { label: "기각", color: "#64748b", bg: "#f1f5f9" },
};

const v_16897e = (v_6fc191): string => {
  if (!v_6fc191) return "—";
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return v_6fc191;
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}:${v_3ee5fb(v_d5dda0.getSeconds())}`;
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

export function v_a24c7a() {
  const [v_7baad1, v_885299] = v_5ab095<Report[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_c68a3b, v_3c7ee2] = v_5ab095<string>("");
  const [v_02be30, v_02c883] = v_5ab095(100);

  const v_f6f5de = v_de06a3(() => {
    v_34a50a(true);
    v_05a921
      .getCloneReports({
        status: v_c68a3b || undefined,
        limit: v_02be30,
      })
      .then((v_cb35cb) => v_885299(v_cb35cb.items))
      .catch((v_49263d) => {
        console.error("getCloneReports failed:", v_49263d);
        v_885299([]);
      })
      .finally(() => v_34a50a(false));
  }, [v_c68a3b, v_02be30]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  return (
    <div>
      <header style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>Reports</h1>
          <p style={v_d81136.sub}>페르소나 신고 기록</p>
        </div>
        <div style={v_d81136.toolbar}>
          <select
            value={v_c68a3b}
            onChange={(v_9e86fd) => v_3c7ee2(v_9e86fd.target.value)}
            style={v_d81136.select}
          >
            <option value="">전체 상태</option>
            <option value="open">신고 접수</option>
            <option value="reviewed">검토 완료</option>
            <option value="dismissed">기각</option>
          </select>
          <select
            value={v_02be30}
            onChange={(v_9e86fd) => v_02c883(Number(v_9e86fd.target.value))}
            style={v_d81136.select}
          >
            <option value={50}>50건</option>
            <option value={100}>100건</option>
            <option value={200}>200건</option>
            <option value={500}>500건</option>
          </select>
          <button onClick={v_f6f5de} style={v_d81136.refreshBtn}>새로고침</button>
        </div>
      </header>

      {v_683210 ? (
        <p>로딩 중...</p>
      ) : v_7baad1.length === 0 ? (
        <div style={v_d81136.empty}>신고 기록이 없습니다.</div>
      ) : (
        <div style={v_d81136.tableWrap}>
          <table style={v_d81136.table}>
            <thead>
              <tr style={v_d81136.theadRow}>
                <th style={v_d81136.th}>#</th>
                <th style={v_d81136.th}>신고자</th>
                <th style={v_d81136.th}>신고된 페르소나</th>
                <th style={v_d81136.th}>페르소나 소유자</th>
                <th style={v_d81136.th}>사유</th>
                <th style={v_d81136.th}>상태</th>
                <th style={v_d81136.th}>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {v_7baad1.map((v_cb35cb) => {
                const v_d308b5 = v_cbb531[v_cb35cb.status] ?? {
                  label: v_cb35cb.status,
                  color: "#1e293b",
                  bg: "#f1f5f9",
                };
                return (
                  <tr key={v_cb35cb.id} style={v_d81136.tr}>
                    <td style={v_d81136.td}>{v_cb35cb.id}</td>
                    <td style={v_d81136.td}>
                      <div style={v_d81136.cellMain}>{v_cb35cb.userName ?? "—"}</div>
                      <div style={v_d81136.cellSub}>{v_cb35cb.userEmail}</div>
                      <div style={v_d81136.cellSub}>id: {v_cb35cb.userId}</div>
                    </td>
                    <td style={v_d81136.td}>
                      <div style={v_d81136.cellMain}>{v_cb35cb.cloneName}</div>
                      <div style={v_d81136.cellSub}>@{v_cb35cb.cloneUsername}</div>
                      <div style={v_d81136.cellSub}>id: {v_cb35cb.cloneId}</div>
                    </td>
                    <td style={v_d81136.td}>
                      <div style={v_d81136.cellMain}>{v_cb35cb.cloneOwnerName ?? "—"}</div>
                      <div style={v_d81136.cellSub}>{v_cb35cb.cloneOwnerEmail ?? ""}</div>
                      <div style={v_d81136.cellSub}>id: {v_cb35cb.cloneOwnerId}</div>
                    </td>
                    <td style={{ ...v_d81136.td, maxWidth: 240 }}>
                      {v_cb35cb.reason ? (
                        <span style={v_d81136.reason}>{v_cb35cb.reason}</span>
                      ) : (
                        <span style={v_d81136.cellSub}>—</span>
                      )}
                    </td>
                    <td style={v_d81136.td}>
                      <span
                        style={{
                          ...v_d81136.badge,
                          color: v_d308b5.color,
                          backgroundColor: v_d308b5.bg,
                        }}
                      >
                        {v_d308b5.label}
                      </span>
                    </td>
                    <td style={v_d81136.td}>
                      <div style={v_d81136.cellMain}>{v_16897e(v_cb35cb.createdAt)}</div>
                      {v_cb35cb.reviewedAt && (
                        <div style={v_d81136.cellSub}>
                          검토: {v_16897e(v_cb35cb.reviewedAt)}
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

const styles: Record<string, v_bb76a8> = {
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
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },
};
