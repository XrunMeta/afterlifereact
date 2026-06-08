

import { v_c4deb2, v_5ab095, v_de06a3, type v_bb76a8 } from "bapkr";
import { v_05a921 } from "../api/client";

const v_cbb531 = {
  open: { label: "신고 접수", color: "#b91c1c", bg: "#fee2e2" },
  reviewed: { label: "검토 완료", color: "#15803d", bg: "#dcfce7" },
  dismissed: { label: "기각", color: "#64748b", bg: "#f1f5f9" },
  actioned: { label: "조치 완료", color: "#1d4ed8", bg: "#dbeafe" },
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

type UserDetail = Awaited<ReturnType<typeof v_05a921.getUserDetail>>;

export function v_f65f90() {
  const [v_7baad1, v_885299] = v_5ab095<Report[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_c68a3b, v_3c7ee2] = v_5ab095<string>("");
  const [v_02be30, v_02c883] = v_5ab095(100);

  const [v_207c31, v_3cc8fd] = v_5ab095<{ targetId: number; reportId: number } | null>(null);
  const [v_3cfdfc, v_c17f56] = v_5ab095<UserDetail | null>(null);
  const [v_9b8188, v_8ac435] = v_5ab095(false);
  const [v_a41171, v_4c9ae6] = v_5ab095(false);

  const v_f6f5de = v_de06a3(() => {
    v_34a50a(true);
    v_05a921
      .getUserReports({
        status: v_c68a3b || undefined,
        limit: v_02be30,
      })
      .then((v_cb35cb) => v_885299(v_cb35cb.items))
      .catch((v_49263d) => {
        console.error("getUserReports failed:", v_49263d);
        v_885299([]);
      })
      .finally(() => v_34a50a(false));
  }, [v_c68a3b, v_02be30]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_158b5f = v_7baad1.reduce<Record<number, number>>((v_9f1d92, v_cb35cb) => {
    v_9f1d92[v_cb35cb.targetId] = (v_9f1d92[v_cb35cb.targetId] ?? 0) + 1;
    return v_9f1d92;
  }, {});

  const v_5b0e11 = (v_b1de41, v_99000e) => {
    v_3cc8fd({ targetId: v_b1de41, reportId: v_99000e });
    v_c17f56(null);
    v_8ac435(true);
    v_05a921
      .getUserDetail(v_b1de41)
      .then(v_c17f56)
      .catch((v_49263d) => console.error("getUserDetail failed:", v_49263d))
      .finally(() => v_8ac435(false));
  };

  const v_fdcc94 = () => {
    v_3cc8fd(null);
    v_c17f56(null);
  };

  const v_cb5993 = async () => {
    if (!v_207c31) return;
    v_4c9ae6(true);
    try {
      const v_8f00b9 = await v_05a921.warnUser(v_207c31.targetId, { reportId: v_207c31.reportId });
      const v_badeaf = v_8f00b9.suspended
        ? `경고 ${v_8f00b9.warningCount}회 — 계정이 1개월 비활성화됐어요 (페르소나 생성 차단).`
        : `경고 ${v_8f00b9.warningCount}회 발급했어요. (3회째에 1개월 비활성화)`;
      alert(v_badeaf);
      const v_3871e2 = await v_05a921.getUserDetail(v_207c31.targetId);
      v_c17f56(v_3871e2);
      v_f6f5de();
    } catch (v_49263d) {
      console.error("warnUser failed:", v_49263d);
      alert("경고 발급에 실패했어요.");
    } finally {
      v_4c9ae6(false);
    }
  };

  const v_e1f1e1 = async () => {
    if (!v_207c31) return;
    v_4c9ae6(true);
    try {
      await v_05a921.dismissUserReport(v_207c31.reportId);
      v_f6f5de();
      v_fdcc94();
    } catch (v_49263d) {
      console.error("dismissUserReport failed:", v_49263d);
      alert("기각 처리에 실패했어요.");
    } finally {
      v_4c9ae6(false);
    }
  };

  return (
    <div>
      <header style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>User Reports</h1>
          <p style={v_d81136.sub}>유저 신고 기록 — 신고자/대상/사유</p>
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
            <option value="actioned">조치 완료</option>
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
        <div style={v_d81136.empty}>유저 신고 기록이 없습니다.</div>
      ) : (
        <div style={v_d81136.tableWrap}>
          <table style={v_d81136.table}>
            <thead>
              <tr style={v_d81136.theadRow}>
                <th style={v_d81136.th}>#</th>
                <th style={v_d81136.th}>신고자</th>
                <th style={v_d81136.th}>신고된 유저</th>
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
                    {}
                    <td
                      style={{ ...v_d81136.td, ...v_d81136.clickable }}
                      onClick={() => v_5b0e11(v_cb35cb.targetId, v_cb35cb.id)}
                      title="신고된 유저 상세 보기"
                    >
                      <div style={v_d81136.cellMain}>{v_cb35cb.reporterName ?? "—"}</div>
                      <div style={v_d81136.cellSub}>{v_cb35cb.reporterEmail}</div>
                      <div style={v_d81136.cellSub}>id: {v_cb35cb.reporterId}</div>
                    </td>
                    <td
                      style={{ ...v_d81136.td, ...v_d81136.clickable }}
                      onClick={() => v_5b0e11(v_cb35cb.targetId, v_cb35cb.id)}
                      title="신고된 유저 상세 보기"
                    >
                      <div style={v_d81136.cellMain}>
                        {v_cb35cb.targetName ?? "—"}
                        {(v_158b5f[v_cb35cb.targetId] ?? 0) >= 2 && (
                          <span style={v_d81136.warnBadge}>
                            ⚠ 신고 {v_158b5f[v_cb35cb.targetId]}건
                          </span>
                        )}
                      </div>
                      <div style={v_d81136.cellSub}>{v_cb35cb.targetEmail}</div>
                      <div style={v_d81136.cellSub}>id: {v_cb35cb.targetId}</div>
                    </td>
                    <td style={{ ...v_d81136.td, maxWidth: 320 }}>
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

      {}
      {v_207c31 && (
        <div style={v_d81136.overlay} onClick={v_fdcc94}>
          <div style={v_d81136.modal} onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <div style={v_d81136.modalHeader}>
              <h2 style={v_d81136.modalTitle}>신고된 유저 상세</h2>
              <button onClick={v_fdcc94} style={v_d81136.closeBtn}>✕</button>
            </div>

            {v_9b8188 || !v_3cfdfc ? (
              <div style={v_d81136.modalLoading}>로딩 중...</div>
            ) : (
              <div style={v_d81136.modalBody}>
                {}
                <div style={v_d81136.detailCard}>
                  <div style={v_d81136.detailName}>
                    {v_3cfdfc.user.name ?? "—"}{" "}
                    <span style={v_d81136.detailEmail}>{v_3cfdfc.user.email}</span>
                  </div>
                  <div style={v_d81136.detailMeta}>id: {v_3cfdfc.user.id} · 가입 {v_3cfdfc.user.createdAt?.slice(0, 10)}</div>
                  <div style={v_d81136.statusRow}>
                    <span style={v_d81136.warnCountBadge}>경고 {v_3cfdfc.user.warningCount}회</span>
                    {v_3cfdfc.user.suspendedUntil &&
                    new Date(v_3cfdfc.user.suspendedUntil) > new Date() ? (
                      <span style={v_d81136.suspendedBadge}>
                        비활성화 ~ {v_3cfdfc.user.suspendedUntil.slice(0, 16)}
                      </span>
                    ) : (
                      <span style={v_d81136.activeBadge}>정상</span>
                    )}
                    {v_3cfdfc.user.deletionState !== "active" && (
                      <span style={v_d81136.deletedBadge}>탈퇴</span>
                    )}
                  </div>
                  <div style={v_d81136.warnHint}>
                    경고 1·2회는 주의, 3회째에 계정이 1개월 비활성화돼요 (구경은 가능, 페르소나 생성 차단).
                  </div>
                </div>

                {}
                <div style={v_d81136.actionRow}>
                  <button
                    onClick={v_cb5993}
                    disabled={v_a41171}
                    style={{ ...v_d81136.actionBtn, ...v_d81136.warnBtn }}
                  >
                    경고 주기 (비활성화 진행)
                  </button>
                  <button
                    onClick={v_e1f1e1}
                    disabled={v_a41171}
                    style={{ ...v_d81136.actionBtn, ...v_d81136.dismissBtn }}
                  >
                    그냥 처리 (신고 기각)
                  </button>
                </div>

                {}
                <div style={v_d81136.section}>
                  <div style={v_d81136.sectionTitle}>받은 신고 ({v_3cfdfc.reports.length})</div>
                  {v_3cfdfc.reports.length === 0 ? (
                    <div style={v_d81136.sectionEmpty}>없음</div>
                  ) : (
                    v_3cfdfc.reports.map((v_cb35cb) => (
                      <div key={v_cb35cb.id} style={v_d81136.listItem}>
                        <div style={v_d81136.listMain}>
                          {v_cb35cb.reason || "(사유 없음)"}{" "}
                          <span style={v_d81136.listStatus}>[{v_cb35cb.status}]</span>
                        </div>
                        <div style={v_d81136.listSub}>
                          {v_cb35cb.reporterEmail} · {v_cb35cb.createdAt?.slice(0, 16)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {}
                <div style={v_d81136.section}>
                  <div style={v_d81136.sectionTitle}>보유 페르소나 ({v_3cfdfc.clones.length})</div>
                  {v_3cfdfc.clones.length === 0 ? (
                    <div style={v_d81136.sectionEmpty}>없음</div>
                  ) : (
                    v_3cfdfc.clones.map((v_966588) => (
                      <div key={v_966588.id} style={v_d81136.listItem}>
                        <div style={v_d81136.listMain}>
                          {v_966588.name} <span style={v_d81136.listSub}>@{v_966588.username}</span>
                          {v_966588.deletionState !== "active" && (
                            <span style={v_d81136.deletedBadge}>삭제됨</span>
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
