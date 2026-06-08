

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { api } from "../api/client";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "신고 접수", color: "#b91c1c", bg: "#fee2e2" },
  reviewed: { label: "검토 완료", color: "#15803d", bg: "#dcfce7" },
  dismissed: { label: "기각", color: "#64748b", bg: "#f1f5f9" },
  actioned: { label: "조치 완료", color: "#1d4ed8", bg: "#dbeafe" },
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
  reporterId: number;
  reporterName: string | null;
  reporterEmail: string;
  targetId: number;
  targetName: string | null;
  targetEmail: string;
  reason: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

type UserDetail = Awaited<ReturnType<typeof api.getUserDetail>>;

export function UserReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [limit, setLimit] = useState(100);

  const [open, setOpen] = useState<{ targetId: number; reportId: number } | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getUserReports({
        status: statusFilter || undefined,
        limit,
      })
      .then((r) => setReports(r.items))
      .catch((err) => {
        console.error("getUserReports failed:", err);
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const reportCountByTarget = reports.reduce<Record<number, number>>((acc, r) => {
    acc[r.targetId] = (acc[r.targetId] ?? 0) + 1;
    return acc;
  }, {});

  const openDetail = (targetId: number, reportId: number) => {
    setOpen({ targetId, reportId });
    setDetail(null);
    setDetailLoading(true);
    api
      .getUserDetail(targetId)
      .then(setDetail)
      .catch((err) => console.error("getUserDetail failed:", err))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setOpen(null);
    setDetail(null);
  };

  const handleWarn = async () => {
    if (!open) return;

    const message = window.prompt(
      "수락(경고) 사유/안내 메시지를 입력하세요. (대상자의 앱 신고내역에 표시됩니다)",
      "",
    );
    if (message === null) return; 
    setActing(true);
    try {
      const res = await api.warnUser(open.targetId, {
        reportId: open.reportId,
        reason: message || undefined,
      });
      const msg = res.suspended
        ? `경고 ${res.warningCount}회 — 계정이 1개월 비활성화됐어요 (페르소나 생성 차단).`
        : `경고 ${res.warningCount}회 발급했어요. (3회째에 1개월 비활성화)`;
      alert(msg);
      const fresh = await api.getUserDetail(open.targetId);
      setDetail(fresh);
      load();
    } catch (err) {
      console.error("warnUser failed:", err);
      alert("경고 발급에 실패했어요.");
    } finally {
      setActing(false);
    }
  };

  const handleDismiss = async () => {
    if (!open) return;

    const message = window.prompt(
      "거절(기각) 사유 메시지를 입력하세요. (신고자의 앱 신고내역에 표시됩니다)",
      "",
    );
    if (message === null) return; 
    setActing(true);
    try {
      await api.dismissUserReport(open.reportId, message || undefined);
      load();
      closeDetail();
    } catch (err) {
      console.error("dismissUserReport failed:", err);
      alert("기각 처리에 실패했어요.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>User Reports</h1>
          <p style={styles.sub}>유저 신고 기록 — 신고자/대상/사유</p>
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
            <option value="actioned">조치 완료</option>
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
        <div style={styles.empty}>유저 신고 기록이 없습니다.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>신고자</th>
                <th style={styles.th}>신고된 유저</th>
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
                    {}
                    <td
                      style={{ ...styles.td, ...styles.clickable }}
                      onClick={() => openDetail(r.targetId, r.id)}
                      title="신고된 유저 상세 보기"
                    >
                      <div style={styles.cellMain}>{r.reporterName ?? "—"}</div>
                      <div style={styles.cellSub}>{r.reporterEmail}</div>
                      <div style={styles.cellSub}>id: {r.reporterId}</div>
                    </td>
                    <td
                      style={{ ...styles.td, ...styles.clickable }}
                      onClick={() => openDetail(r.targetId, r.id)}
                      title="신고된 유저 상세 보기"
                    >
                      <div style={styles.cellMain}>
                        {r.targetName ?? "—"}
                        {(reportCountByTarget[r.targetId] ?? 0) >= 2 && (
                          <span style={styles.warnBadge}>
                            ⚠ 신고 {reportCountByTarget[r.targetId]}건
                          </span>
                        )}
                      </div>
                      <div style={styles.cellSub}>{r.targetEmail}</div>
                      <div style={styles.cellSub}>id: {r.targetId}</div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: 320 }}>
                      {r.reason ? (
                        <span style={styles.reason}>{r.reason}</span>
                      ) : (
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

      {}
      {open && (
        <div style={styles.overlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>신고된 유저 상세</h2>
              <button onClick={closeDetail} style={styles.closeBtn}>✕</button>
            </div>

            {detailLoading || !detail ? (
              <div style={styles.modalLoading}>로딩 중...</div>
            ) : (
              <div style={styles.modalBody}>
                {}
                <div style={styles.detailCard}>
                  <div style={styles.detailName}>
                    {detail.user.name ?? "—"}{" "}
                    <span style={styles.detailEmail}>{detail.user.email}</span>
                  </div>
                  <div style={styles.detailMeta}>id: {detail.user.id} · 가입 {detail.user.createdAt?.slice(0, 10)}</div>
                  <div style={styles.statusRow}>
                    <span style={styles.warnCountBadge}>경고 {detail.user.warningCount}회</span>
                    {detail.user.suspendedUntil &&
                    new Date(detail.user.suspendedUntil) > new Date() ? (
                      <span style={styles.suspendedBadge}>
                        비활성화 ~ {detail.user.suspendedUntil.slice(0, 16)}
                      </span>
                    ) : (
                      <span style={styles.activeBadge}>정상</span>
                    )}
                    {detail.user.deletionState !== "active" && (
                      <span style={styles.deletedBadge}>탈퇴</span>
                    )}
                  </div>
                  <div style={styles.warnHint}>
                    경고 1·2회는 주의, 3회째에 계정이 1개월 비활성화돼요 (구경은 가능, 페르소나 생성 차단).
                  </div>
                </div>

                {}
                <div style={styles.actionRow}>
                  <button
                    onClick={handleWarn}
                    disabled={acting}
                    style={{ ...styles.actionBtn, ...styles.warnBtn }}
                  >
                    경고 주기 (비활성화 진행)
                  </button>
                  <button
                    onClick={handleDismiss}
                    disabled={acting}
                    style={{ ...styles.actionBtn, ...styles.dismissBtn }}
                  >
                    그냥 처리 (신고 기각)
                  </button>
                </div>

                {}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>받은 신고 ({detail.reports.length})</div>
                  {detail.reports.length === 0 ? (
                    <div style={styles.sectionEmpty}>없음</div>
                  ) : (
                    detail.reports.map((r) => (
                      <div key={r.id} style={styles.listItem}>
                        <div style={styles.listMain}>
                          {r.reason || "(사유 없음)"}{" "}
                          <span style={styles.listStatus}>[{r.status}]</span>
                        </div>
                        <div style={styles.listSub}>
                          {r.reporterEmail} · {r.createdAt?.slice(0, 16)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>보유 페르소나 ({detail.clones.length})</div>
                  {detail.clones.length === 0 ? (
                    <div style={styles.sectionEmpty}>없음</div>
                  ) : (
                    detail.clones.map((cl) => (
                      <div key={cl.id} style={styles.listItem}>
                        <div style={styles.listMain}>
                          {cl.name} <span style={styles.listSub}>@{cl.username}</span>
                          {cl.deletionState !== "active" && (
                            <span style={styles.deletedBadge}>삭제됨</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },
  clickable: { cursor: "pointer" },
  warnBadge: {
    display: "inline-block",
    marginLeft: 8,
    padding: "1px 7px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    color: "#b45309",
    backgroundColor: "#fef3c7",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 640,
    maxHeight: "88vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: { margin: 0, fontSize: 17, color: "#0f172a" },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#64748b",
  },
  modalLoading: { padding: 40, textAlign: "center", color: "#94a3b8" },
  modalBody: { padding: "16px 20px", overflowY: "auto" },
  detailCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  detailName: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  detailEmail: { fontSize: 12, fontWeight: 400, color: "#64748b" },
  detailMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  statusRow: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" },
  warnCountBadge: {
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: "#b45309",
    backgroundColor: "#fef3c7",
  },
  suspendedBadge: {
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
  },
  activeBadge: {
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: "#15803d",
    backgroundColor: "#dcfce7",
  },
  deletedBadge: {
    display: "inline-block",
    marginLeft: 6,
    padding: "1px 7px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
  },
  warnHint: { fontSize: 11, color: "#94a3b8", marginTop: 10, lineHeight: 1.5 },
  actionRow: { display: "flex", gap: 8, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    padding: "10px 12px",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  warnBtn: { color: "#fff", backgroundColor: "#b45309" },
  dismissBtn: { color: "#334155", backgroundColor: "#e2e8f0" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sectionEmpty: { fontSize: 12, color: "#94a3b8" },
  listItem: { padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  listMain: { fontSize: 13, color: "#0f172a" },
  listSub: { fontSize: 11, color: "#64748b" },
  listStatus: { fontSize: 11, color: "#64748b" },
};
