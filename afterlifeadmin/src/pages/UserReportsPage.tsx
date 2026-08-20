

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

  const [reasonFilter, setReasonFilter] = useState<string>("");
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
        reason: reasonFilter || undefined,
        limit,
      })
      .then((r) => setReports(r.items))
      .catch((err) => {
        console.error("getUserReports failed:", err);
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, reasonFilter, limit]);

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

  const applyPenalty = async (
    action:
      | "clone_deactivate"
      | "clone_delete"
      | "clone_create_ban"
      | "account_ban"
      | "account_withdraw",
    label: string,
    warnMsg: string,
  ) => {
    if (!open) return;
    if (!window.confirm(`${label}\n\n${warnMsg}\n\n실행할까요?`)) return;
    let suspendDays: number | undefined;
    if (action === "clone_create_ban" || action === "account_ban") {
      const raw = window.prompt(`${label} — 기간(일) 입력 (빈칸=30일)`, "30");
      if (raw === null) return;
      const n = Number(raw);
      suspendDays = Number.isInteger(n) && n > 0 ? n : 30;
    }
    const reason = window.prompt(
      `${label} — 대상 유저에게 표시할 사유 (선택)`,
      "",
    );
    if (reason === null) return;
    setActing(true);
    try {
      const res = await api.applyUserPenalty(open.targetId, {
        action,
        suspendDays: suspendDays ?? null,
        reason: reason || undefined,
      });
      alert(res.message || "적용 완료");
      const fresh = await api.getUserDetail(open.targetId);
      setDetail(fresh);
      load();
    } catch (err) {
      console.error(`applyUserPenalty[${action}] failed:`, err);
      alert(`${label} 실행에 실패했어요.`);
    } finally {
      setActing(false);
    }
  };

  const deleteSingleClone = async (cloneId: number, cloneName: string) => {
    if (!open) return;
    if (!window.confirm(`페르소나 "${cloneName}" (id:${cloneId}) 를 삭제할까요?\n해당 유저의 다른 페르소나엔 영향 없습니다.`)) return;
    setActing(true);
    try {
      await api.deleteClone(cloneId, "관리자 삭제 (신고 처리)");
      alert("페르소나 삭제 완료");
      const fresh = await api.getUserDetail(open.targetId);
      setDetail(fresh);
      load();
    } catch (err) {
      console.error("deleteClone failed:", err);
      alert("페르소나 삭제에 실패했어요.");
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
                    경고 주기 (3회째 자동 정지)
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
                <div style={styles.penaltyGroupTitle}>페르소나 제재</div>
                <div style={styles.penaltyRow}>
                  <button
                    onClick={() =>
                      applyPenalty(
                        "clone_deactivate",
                        "페르소나 전체 비활성화",
                        "이 유저의 모든 페르소나를 비활성화(hide)합니다. 관리자가 재활성화 전까지 유지.",
                      )
                    }
                    disabled={acting}
                    style={{ ...styles.penaltyBtn, ...styles.penaltyBtnAmber }}
                  >
                    페르소나 전체 비활성화
                  </button>
                  <button
                    onClick={() =>
                      applyPenalty(
                        "clone_delete",
                        "페르소나 전체 삭제",
                        "이 유저의 모든 페르소나를 삭제합니다. (복구 불가에 가까움)",
                      )
                    }
                    disabled={acting}
                    style={{ ...styles.penaltyBtn, ...styles.penaltyBtnRed }}
                  >
                    페르소나 전체 삭제
                  </button>
                  <button
                    onClick={() =>
                      applyPenalty(
                        "clone_create_ban",
                        "페르소나 생성 N일 금지",
                        "기존 페르소나는 유지, 신규 생성만 N일 차단합니다.",
                      )
                    }
                    disabled={acting}
                    style={{ ...styles.penaltyBtn, ...styles.penaltyBtnAmber }}
                  >
                    페르소나 생성 금지 (N일)
                  </button>
                </div>

                <div style={styles.penaltyGroupTitle}>계정 제재</div>
                <div style={styles.penaltyRow}>
                  <button
                    onClick={() =>
                      applyPenalty(
                        "account_ban",
                        "계정 비활성화 (N일)",
                        "계정 접근 자체를 N일 차단합니다. (로그인 불가)",
                      )
                    }
                    disabled={acting}
                    style={{ ...styles.penaltyBtn, ...styles.penaltyBtnRed }}
                  >
                    계정 비활성화 (N일)
                  </button>
                  <button
                    onClick={() =>
                      applyPenalty(
                        "account_withdraw",
                        "계정 강제 탈퇴",
                        "해당 계정을 즉시 탈퇴 처리합니다. (soft-delete · 페르소나도 함께 삭제 · 관리자 복구 안 하면 사실상 영구)",
                      )
                    }
                    disabled={acting}
                    style={{ ...styles.penaltyBtn, ...styles.penaltyBtnDark }}
                  >
                    계정 강제 탈퇴
                  </button>
                </div>

                {}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>받은 신고 ({detail.reports.length})</div>
                  {detail.reports.length === 0 ? (
                    <div style={styles.sectionEmpty}>없음</div>
                  ) : (
                    detail.reports.map((r) => {
                      const sev = SEVERITY_COLORS[severityForReason(r.reason)];
                      return (
                        <div key={r.id} style={styles.listItem}>
                          <div style={styles.listMain}>
                            {r.reason ? (
                              <span
                                style={{
                                  ...styles.reasonBadge,
                                  color: sev.color,
                                  backgroundColor: sev.bg,
                                  borderColor: sev.border,
                                }}
                              >
                                {r.reason}
                              </span>
                            ) : (
                              <span style={styles.listSub}>(사유 없음)</span>
                            )}{" "}
                            <span style={styles.listStatus}>[{r.status}]</span>
                          </div>
                          <div style={styles.listSub}>
                            {r.reporterEmail} · {r.createdAt?.slice(0, 16)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {}
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>보유 페르소나 ({detail.clones.length})</div>
                  {detail.clones.length === 0 ? (
                    <div style={styles.sectionEmpty}>없음</div>
                  ) : (
                    detail.clones.map((cl) => (
                      <div key={cl.id} style={styles.cloneRow}>
                        <div style={{ flex: 1 }}>
                          <div style={styles.listMain}>
                            {cl.name} <span style={styles.listSub}>@{cl.username}</span>
                            {cl.deletionState !== "active" && (
                              <span style={styles.deletedBadge}>삭제됨</span>
                            )}
                          </div>
                          <div style={styles.listSub}>id: {cl.id}</div>
                        </div>
                        {cl.deletionState === "active" && (
                          <button
                            onClick={() => deleteSingleClone(cl.id, cl.name)}
                            disabled={acting}
                            style={styles.miniDeleteBtn}
                          >
                            삭제
                          </button>
                        )}
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

  penaltyGroupTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  penaltyRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  penaltyBtn: {
    padding: "8px 12px",
    border: "1px solid",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: "#fff",
  },
  penaltyBtnAmber: { color: "#b45309", borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  penaltyBtnRed: { color: "#b91c1c", borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  penaltyBtnDark: { color: "#fff", borderColor: "#0f172a", backgroundColor: "#0f172a" },
  cloneRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  miniDeleteBtn: {
    padding: "6px 12px",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    cursor: "pointer",
  },
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
