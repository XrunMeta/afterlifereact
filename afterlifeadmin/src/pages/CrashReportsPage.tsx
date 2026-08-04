

import {
  v_c4deb2,
  v_5ab095,
  v_de06a3,
  type v_bb76a8,
  type v_f0e313,
} from "bapkr";
import { v_05a921 } from "../api/client";

const v_142769 = (v_d799e2): string => {
  if (!v_d799e2) return "—";
  const v_d5dda0 = new Date(v_d799e2);
  if (Number.isNaN(v_d5dda0.getTime())) return String(v_d799e2);
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}:${v_3ee5fb(v_d5dda0.getSeconds())}`;
};

interface CrashListItem {
  id: number;
  userId: number | null;
  userEmail: string | null;
  ts: number;
  receivedAt: number;
  isFatal: boolean;
  errorName: string | null;
  message: string;
  screen: string | null;
  appVersion: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  channel: string | null;
  platform: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  locale: string | null;
}

interface CrashDetail extends CrashListItem {
  stack: string | null;
  breadcrumbs: Array<{
    category: string;
    message: string;
    ts?: number;
    data?: Record<string, unknown>;
  }>;
  extra: Record<string, unknown> | null;
}

export function v_f731ac() {
  const [v_4622b9, v_fa923c] = v_5ab095<CrashListItem[]>([]);
  const [v_c83285, v_8eee5e] = v_5ab095(0);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_587413, v_2122dd] = v_5ab095<CrashDetail | null>(null);
  const [v_0a3fe8, v_44b177] = v_5ab095(false);

  const [v_875a2b, v_26abff] = v_5ab095<"all" | "0" | "1">("all");
  const [v_1d58d7, v_c8f7d0] = v_5ab095("");
  const [v_dda6a6, v_6c9511] = v_5ab095("");
  const [v_9b1b7b, v_debedd] = v_5ab095("");
  const [v_bbb69a, v_5a0a1c] = v_5ab095("");
  const [v_02be30, v_02c883] = v_5ab095(100);
  const [v_3bbadf, v_919214] = v_5ab095(0);

  const v_f6f5de = v_de06a3(() => {
    v_34a50a(true);
    v_05a921
      .getCrashReports({
        fatal: v_875a2b === "all" ? undefined : v_875a2b,
        screen: v_9b1b7b || undefined,
        q: v_bbb69a || undefined,
        limit: v_02be30,
        offset: v_3bbadf,
      })
      .then((v_cb35cb) => {
        v_fa923c(v_cb35cb.items);
        v_8eee5e(v_cb35cb.total);
      })
      .catch((v_49263d) => {
        console.error("getCrashReports failed:", v_49263d);
        v_fa923c([]);
        v_8eee5e(0);
      })
      .finally(() => v_34a50a(false));
  }, [v_875a2b, v_9b1b7b, v_bbb69a, v_02be30, v_3bbadf]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_5b0e11 = (v_389afb) => {
    v_44b177(true);
    v_2122dd(null);
    v_05a921
      .getCrashReport(v_389afb)
      .then((v_cb35cb) => v_2122dd(v_cb35cb.item))
      .catch((v_49263d) => {
        console.error("getCrashReport failed:", v_49263d);
        v_2122dd(null);
      })
      .finally(() => v_44b177(false));
  };

  const v_9bb421 = (v_389afb) => {
    if (!confirm(`리포트 #${v_389afb} 를 삭제할까요? 되돌릴 수 없어요.`)) return;
    v_05a921
      .deleteCrashReport(v_389afb)
      .then(() => {
        v_fa923c((v_ba2215) => v_ba2215.filter((v_cb35cb) => v_cb35cb.id !== v_389afb));
        v_8eee5e((v_f4e98d) => Math.max(0, v_f4e98d - 1));
        if (v_587413?.id === v_389afb) v_2122dd(null);
      })
      .catch((v_49263d) => {
        alert(`삭제 실패: ${v_49263d instanceof Error ? v_49263d.message : String(v_49263d)}`);
      });
  };

  const v_15fbd5 = (e: v_f0e313) => {
    v_9e86fd.preventDefault();
    v_919214(0);
    v_debedd(v_1d58d7.trim());
    v_5a0a1c(v_dda6a6.trim());
  };
  const v_516880 = () => {
    v_c8f7d0("");
    v_6c9511("");
    v_26abff("all");
    v_919214(0);
    v_debedd("");
    v_5a0a1c("");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>크래시 리포트</h1>
      <div style={{ marginBottom: 24, color: "#64748b", fontSize: 13 }}>
        앱에서 발생한 JS 예외·unhandled rejection·ErrorBoundary 잡힘. 개인정보는 앱에서 스크럽 후 전송(토큰·발화·L2·이메일·휴대폰). T-211(회색화면 프리즈) 재현에 필요한 화면·breadcrumb 이 함께 저장됨.
      </div>

      <form onSubmit={v_15fbd5} style={v_fd7a1b}>
        <select
          value={v_875a2b}
          onChange={(v_9e86fd) => {
            v_26abff(v_9e86fd.target.value as "all" | "0" | "1");
            v_919214(0);
          }}
          style={v_1712c9}
        >
          <option value="all">전체</option>
          <option value="1">Fatal 만</option>
          <option value="0">Warn 만</option>
        </select>
        <input
          type="text"
          value={v_1d58d7}
          onChange={(v_9e86fd) => v_c8f7d0(v_9e86fd.target.value)}
          placeholder="화면 (예: MyClonesDashboard)"
          style={v_bbda62}
        />
        <input
          type="text"
          value={v_dda6a6}
          onChange={(v_9e86fd) => v_6c9511(v_9e86fd.target.value)}
          placeholder="메시지 검색"
          style={v_bbda62}
        />
        <select
          value={v_02be30}
          onChange={(v_9e86fd) => {
            v_02c883(Number(v_9e86fd.target.value));
            v_919214(0);
          }}
          style={v_1712c9}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <button type="submit" style={v_310480}>필터 적용</button>
        <button type="button" onClick={v_516880} style={v_bd588e}>초기화</button>
        <button type="button" onClick={v_f6f5de} style={v_bd588e}>새로고침</button>
      </form>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#64748b" }}>
            총 {v_c83285}건 · {v_3bbadf + 1}–{Math.min(v_3bbadf + v_02be30, v_c83285)} 표시
          </div>
          <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={v_3018ef}>시간</th>
                  <th style={v_3018ef}>레벨</th>
                  <th style={v_3018ef}>화면</th>
                  <th style={v_3018ef}>에러</th>
                  <th style={v_3018ef}>메시지</th>
                  <th style={v_3018ef}>사용자</th>
                  <th style={v_3018ef}>플랫폼</th>
                  <th style={v_3018ef}>앱버전</th>
                  <th style={v_3018ef}></th>
                </tr>
              </thead>
              <tbody>
                {v_683210 ? (
                  <tr><td colSpan={9} style={v_e7ed32}>불러오는 중…</td></tr>
                ) : v_4622b9.length === 0 ? (
                  <tr><td colSpan={9} style={v_e7ed32}>리포트가 없어요.</td></tr>
                ) : (
                  v_4622b9.map((v_cb35cb) => {
                    const v_fdbfb0 = v_587413?.id === v_cb35cb.id;
                    return (
                      <tr
                        key={v_cb35cb.id}
                        onClick={() => v_5b0e11(v_cb35cb.id)}
                        style={{
                          cursor: "pointer",
                          background: v_fdbfb0 ? "#eff6ff" : "transparent",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <td style={v_083191}>{v_142769(v_cb35cb.receivedAt)}</td>
                        <td style={v_083191}>
                          <span style={v_cb35cb.isFatal ? v_bd7eee : v_a69c84}>
                            {v_cb35cb.isFatal ? "FATAL" : "WARN"}
                          </span>
                        </td>
                        <td style={{ ...v_083191, fontFamily: "monospace" }}>{v_cb35cb.screen ?? "—"}</td>
                        <td style={{ ...v_083191, fontFamily: "monospace" }}>{v_cb35cb.errorName ?? "Error"}</td>
                        <td style={{ ...v_083191, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v_cb35cb.message}</td>
                        <td style={v_083191}>{v_cb35cb.userEmail ?? (v_cb35cb.userId ? `#${v_cb35cb.userId}` : "익명")}</td>
                        <td style={v_083191}>{v_cb35cb.platform ?? "—"} {v_cb35cb.osVersion ?? ""}</td>
                        <td style={v_083191}>{v_cb35cb.appVersion ?? "—"}</td>
                        <td style={v_083191}>
                          <button
                            type="button"
                            onClick={(v_9e86fd) => { v_9e86fd.stopPropagation(); v_9bb421(v_cb35cb.id); }}
                            style={v_e03d3c}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => v_919214(Math.max(0, v_3bbadf - v_02be30))}
              disabled={v_3bbadf === 0}
              style={{ ...v_bd588e, opacity: v_3bbadf === 0 ? 0.4 : 1 }}
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => v_919214(v_3bbadf + v_02be30)}
              disabled={v_3bbadf + v_02be30 >= v_c83285}
              style={{ ...v_bd588e, opacity: v_3bbadf + v_02be30 >= v_c83285 ? 0.4 : 1 }}
            >
              다음
            </button>
          </div>
        </div>

        {}
        <aside style={v_b2e48e}>
          {v_0a3fe8 ? (
            <div style={{ padding: 24, color: "#64748b" }}>불러오는 중…</div>
          ) : !v_587413 ? (
            <div style={{ padding: 24, color: "#94a3b8", fontSize: 13 }}>
              왼쪽 목록에서 리포트를 클릭하면 상세가 여기 표시됩니다.
            </div>
          ) : (
            <>
              <div style={v_e170ee}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={v_587413.isFatal ? v_bd7eee : v_a69c84}>{v_587413.isFatal ? "FATAL" : "WARN"}</span>
                  <strong style={{ fontFamily: "monospace" }}>#{v_587413.id}</strong>
                </div>
                <button type="button" onClick={() => v_2122dd(null)} style={v_2dac9c}>닫기</button>
              </div>

              <MetaRow label="발생 시각">{v_142769(v_587413.ts)}</MetaRow>
              <MetaRow label="수신 시각">{v_142769(v_587413.receivedAt)}</MetaRow>
              <MetaRow label="화면">{v_587413.screen ?? "—"}</MetaRow>
              <MetaRow label="에러 클래스">{v_587413.errorName ?? "Error"}</MetaRow>
              <MetaRow label="사용자">
                {v_587413.userEmail ? `${v_587413.userEmail} (#${v_587413.userId})` : v_587413.userId ? `#${v_587413.userId}` : "익명"}
              </MetaRow>
              <MetaRow label="플랫폼">{v_587413.platform ?? "—"} {v_587413.osVersion ?? ""}</MetaRow>
              <MetaRow label="기기">{v_587413.deviceModel ?? "—"}</MetaRow>
              <MetaRow label="앱 / 런타임">
                {(v_587413.appVersion ?? "—") + " · " + (v_587413.runtimeVersion ?? "—")}
              </MetaRow>
              <MetaRow label="채널 / OTA">
                {(v_587413.channel ?? "—") + " · " + (v_587413.updateId?.slice(0, 12) ?? "—")}
              </MetaRow>
              <MetaRow label="로케일">{v_587413.locale ?? "—"}</MetaRow>

              <h3 style={v_4c1d16}>메시지</h3>
              <pre style={v_5cce2c}>{v_587413.message}</pre>

              {v_587413.stack ? (
                <>
                  <h3 style={v_4c1d16}>스택</h3>
                  <pre style={v_5cce2c}>{v_587413.stack}</pre>
                </>
              ) : null}

              {v_587413.breadcrumbs.length ? (
                <>
                  <h3 style={v_4c1d16}>Breadcrumbs (최근 {v_587413.breadcrumbs.length}개)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {v_587413.breadcrumbs.map((v_148ff6, v_ebec57) => (
                      <div key={v_ebec57} style={v_13917b}>
                        <span style={v_6c8675}>{v_148ff6.category}</span>
                        <span style={{ flex: 1, wordBreak: "break-all" }}>{v_148ff6.message}</span>
                        {v_148ff6.ts ? <span style={{ color: "#94a3b8", fontSize: 11 }}>{v_142769(v_148ff6.ts)}</span> : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {v_587413.extra ? (
                <>
                  <h3 style={v_4c1d16}>Extra</h3>
                  <pre style={v_5cce2c}>{JSON.stringify(v_587413.extra, null, 2)}</pre>
                </>
              ) : null}

              <div style={{ marginTop: 20 }}>
                <button type="button" onClick={() => v_9bb421(v_587413.id)} style={v_e03d3c}>
                  이 리포트 삭제
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function v_1e7f37({ label: v_2869c1, children: v_21f619 }: { label: string; children: React.ReactNode }) {
  return (
    <div style={v_2bf5e3}>
      <span style={v_74b045}>{v_2869c1}</span>
      <span style={v_98cb4b}>{v_21f619}</span>
    </div>
  );
}

const filterRow: v_bb76a8 = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
  flexWrap: "wrap",
  alignItems: "center",
};
const input: v_bb76a8 = {
  padding: "6px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  minWidth: 180,
};
const select: v_bb76a8 = {
  padding: "6px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
};
const btnPrimary: v_bb76a8 = {
  padding: "6px 14px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhost: v_bb76a8 = {
  padding: "6px 12px",
  background: "#fff",
  color: "#334155",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhostSmall: v_bb76a8 = { ...v_bd588e, padding: "4px 8px", fontSize: 12 };
const btnDanger: v_bb76a8 = {
  padding: "4px 10px",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 600,
};
const th: v_bb76a8 = { padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#475569", borderBottom: "1px solid #e2e8f0" };
const td: v_bb76a8 = { padding: "8px 10px", verticalAlign: "top" };
const tdEmpty: v_bb76a8 = { padding: "24px", textAlign: "center", color: "#94a3b8" };
const badgeFatal: v_bb76a8 = {
  fontSize: 10,
  fontWeight: 700,
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "2px 6px",
  borderRadius: 4,
};
const badgeWarn: v_bb76a8 = {
  fontSize: 10,
  fontWeight: 700,
  background: "#fef3c7",
  color: "#b45309",
  padding: "2px 6px",
  borderRadius: 4,
};
const detailPanel: v_bb76a8 = {
  width: 480,
  maxWidth: "40vw",
  minWidth: 320,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  position: "sticky",
  top: 16,
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
};
const detailHeader: v_bb76a8 = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: "1px solid #f1f5f9",
};
const metaRow: v_bb76a8 = {
  display: "flex",
  gap: 8,
  fontSize: 12,
  padding: "3px 0",
};
const metaLabel: v_bb76a8 = { width: 92, color: "#64748b", flexShrink: 0 };
const metaValue: v_bb76a8 = { color: "#0f172a", wordBreak: "break-all" };
const sectionTitle: v_bb76a8 = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  marginTop: 16,
  marginBottom: 6,
};
const pre: v_bb76a8 = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 6,
  fontSize: 11,
  overflow: "auto",
  maxHeight: 300,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};
const breadcrumbRow: v_bb76a8 = {
  display: "flex",
  gap: 8,
  fontSize: 11,
  padding: "3px 6px",
  background: "#f8fafc",
  borderRadius: 4,
  alignItems: "baseline",
};
const breadcrumbCategory: v_bb76a8 = {
  fontWeight: 700,
  color: "#3b82f6",
  minWidth: 80,
};
