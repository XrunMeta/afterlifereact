

import {
  useEffect,
  useState,
  useCallback,
  type CSSProperties,
  type FormEvent,
} from "react";
import { api } from "../api/client";

const formatMs = (ms: number | null | undefined): string => {
  if (!ms) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export function CrashReportsPage() {
  const [items, setItems] = useState<CrashListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CrashDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const [fatalFilter, setFatalFilter] = useState<"all" | "0" | "1">("all");
  const [screenFilter, setScreenFilter] = useState("");
  const [qInput, setQInput] = useState("");
  const [appliedScreen, setAppliedScreen] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getCrashReports({
        fatal: fatalFilter === "all" ? undefined : fatalFilter,
        screen: appliedScreen || undefined,
        q: appliedQ || undefined,
        limit,
        offset,
      })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err) => {
        console.error("getCrashReports failed:", err);
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [fatalFilter, appliedScreen, appliedQ, limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (id: number) => {
    setSelectedLoading(true);
    setSelected(null);
    api
      .getCrashReport(id)
      .then((r) => setSelected(r.item))
      .catch((err) => {
        console.error("getCrashReport failed:", err);
        setSelected(null);
      })
      .finally(() => setSelectedLoading(false));
  };

  const onDelete = (id: number) => {
    if (!confirm(`리포트 #${id} 를 삭제할까요? 되돌릴 수 없어요.`)) return;
    api
      .deleteCrashReport(id)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== id));
        setTotal((n) => Math.max(0, n - 1));
        if (selected?.id === id) setSelected(null);
      })
      .catch((err) => {
        alert(`삭제 실패: ${err instanceof Error ? err.message : String(err)}`);
      });
  };

  const onApplyFilter = (e: FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setAppliedScreen(screenFilter.trim());
    setAppliedQ(qInput.trim());
  };
  const onClearFilter = () => {
    setScreenFilter("");
    setQInput("");
    setFatalFilter("all");
    setOffset(0);
    setAppliedScreen("");
    setAppliedQ("");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>크래시 리포트</h1>
      <div style={{ marginBottom: 24, color: "#64748b", fontSize: 13 }}>
        앱에서 발생한 JS 예외·unhandled rejection·ErrorBoundary 잡힘. 개인정보는 앱에서 스크럽 후 전송(토큰·발화·L2·이메일·휴대폰). T-211(회색화면 프리즈) 재현에 필요한 화면·breadcrumb 이 함께 저장됨.
      </div>

      <form onSubmit={onApplyFilter} style={filterRow}>
        <select
          value={fatalFilter}
          onChange={(e) => {
            setFatalFilter(e.target.value as "all" | "0" | "1");
            setOffset(0);
          }}
          style={select}
        >
          <option value="all">전체</option>
          <option value="1">Fatal 만</option>
          <option value="0">Warn 만</option>
        </select>
        <input
          type="text"
          value={screenFilter}
          onChange={(e) => setScreenFilter(e.target.value)}
          placeholder="화면 (예: MyClonesDashboard)"
          style={input}
        />
        <input
          type="text"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="메시지 검색"
          style={input}
        />
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setOffset(0);
          }}
          style={select}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <button type="submit" style={btnPrimary}>필터 적용</button>
        <button type="button" onClick={onClearFilter} style={btnGhost}>초기화</button>
        <button type="button" onClick={load} style={btnGhost}>새로고침</button>
      </form>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#64748b" }}>
            총 {total}건 · {offset + 1}–{Math.min(offset + limit, total)} 표시
          </div>
          <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={th}>시간</th>
                  <th style={th}>레벨</th>
                  <th style={th}>화면</th>
                  <th style={th}>에러</th>
                  <th style={th}>메시지</th>
                  <th style={th}>사용자</th>
                  <th style={th}>플랫폼</th>
                  <th style={th}>앱버전</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={tdEmpty}>불러오는 중…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={9} style={tdEmpty}>리포트가 없어요.</td></tr>
                ) : (
                  items.map((r) => {
                    const isSel = selected?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => openDetail(r.id)}
                        style={{
                          cursor: "pointer",
                          background: isSel ? "#eff6ff" : "transparent",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <td style={td}>{formatMs(r.receivedAt)}</td>
                        <td style={td}>
                          <span style={r.isFatal ? badgeFatal : badgeWarn}>
                            {r.isFatal ? "FATAL" : "WARN"}
                          </span>
                        </td>
                        <td style={{ ...td, fontFamily: "monospace" }}>{r.screen ?? "—"}</td>
                        <td style={{ ...td, fontFamily: "monospace" }}>{r.errorName ?? "Error"}</td>
                        <td style={{ ...td, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</td>
                        <td style={td}>{r.userEmail ?? (r.userId ? `#${r.userId}` : "익명")}</td>
                        <td style={td}>{r.platform ?? "—"} {r.osVersion ?? ""}</td>
                        <td style={td}>{r.appVersion ?? "—"}</td>
                        <td style={td}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                            style={btnDanger}
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
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              style={{ ...btnGhost, opacity: offset === 0 ? 0.4 : 1 }}
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              style={{ ...btnGhost, opacity: offset + limit >= total ? 0.4 : 1 }}
            >
              다음
            </button>
          </div>
        </div>

        {}
        <aside style={detailPanel}>
          {selectedLoading ? (
            <div style={{ padding: 24, color: "#64748b" }}>불러오는 중…</div>
          ) : !selected ? (
            <div style={{ padding: 24, color: "#94a3b8", fontSize: 13 }}>
              왼쪽 목록에서 리포트를 클릭하면 상세가 여기 표시됩니다.
            </div>
          ) : (
            <>
              <div style={detailHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={selected.isFatal ? badgeFatal : badgeWarn}>{selected.isFatal ? "FATAL" : "WARN"}</span>
                  <strong style={{ fontFamily: "monospace" }}>#{selected.id}</strong>
                </div>
                <button type="button" onClick={() => setSelected(null)} style={btnGhostSmall}>닫기</button>
              </div>

              <MetaRow label="발생 시각">{formatMs(selected.ts)}</MetaRow>
              <MetaRow label="수신 시각">{formatMs(selected.receivedAt)}</MetaRow>
              <MetaRow label="화면">{selected.screen ?? "—"}</MetaRow>
              <MetaRow label="에러 클래스">{selected.errorName ?? "Error"}</MetaRow>
              <MetaRow label="사용자">
                {selected.userEmail ? `${selected.userEmail} (#${selected.userId})` : selected.userId ? `#${selected.userId}` : "익명"}
              </MetaRow>
              <MetaRow label="플랫폼">{selected.platform ?? "—"} {selected.osVersion ?? ""}</MetaRow>
              <MetaRow label="기기">{selected.deviceModel ?? "—"}</MetaRow>
              <MetaRow label="앱 / 런타임">
                {(selected.appVersion ?? "—") + " · " + (selected.runtimeVersion ?? "—")}
              </MetaRow>
              <MetaRow label="채널 / OTA">
                {(selected.channel ?? "—") + " · " + (selected.updateId?.slice(0, 12) ?? "—")}
              </MetaRow>
              <MetaRow label="로케일">{selected.locale ?? "—"}</MetaRow>

              <h3 style={sectionTitle}>메시지</h3>
              <pre style={pre}>{selected.message}</pre>

              {selected.stack ? (
                <>
                  <h3 style={sectionTitle}>스택</h3>
                  <pre style={pre}>{selected.stack}</pre>
                </>
              ) : null}

              {selected.breadcrumbs.length ? (
                <>
                  <h3 style={sectionTitle}>Breadcrumbs (최근 {selected.breadcrumbs.length}개)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {selected.breadcrumbs.map((b, i) => (
                      <div key={i} style={breadcrumbRow}>
                        <span style={breadcrumbCategory}>{b.category}</span>
                        <span style={{ flex: 1, wordBreak: "break-all" }}>{b.message}</span>
                        {b.ts ? <span style={{ color: "#94a3b8", fontSize: 11 }}>{formatMs(b.ts)}</span> : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selected.extra ? (
                <>
                  <h3 style={sectionTitle}>Extra</h3>
                  <pre style={pre}>{JSON.stringify(selected.extra, null, 2)}</pre>
                </>
              ) : null}

              <div style={{ marginTop: 20 }}>
                <button type="button" onClick={() => onDelete(selected.id)} style={btnDanger}>
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

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={metaRow}>
      <span style={metaLabel}>{label}</span>
      <span style={metaValue}>{children}</span>
    </div>
  );
}

const filterRow: CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
  flexWrap: "wrap",
  alignItems: "center",
};
const input: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  minWidth: 180,
};
const select: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
};
const btnPrimary: CSSProperties = {
  padding: "6px 14px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  padding: "6px 12px",
  background: "#fff",
  color: "#334155",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhostSmall: CSSProperties = { ...btnGhost, padding: "4px 8px", fontSize: 12 };
const btnDanger: CSSProperties = {
  padding: "4px 10px",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 600,
};
const th: CSSProperties = { padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#475569", borderBottom: "1px solid #e2e8f0" };
const td: CSSProperties = { padding: "8px 10px", verticalAlign: "top" };
const tdEmpty: CSSProperties = { padding: "24px", textAlign: "center", color: "#94a3b8" };
const badgeFatal: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "2px 6px",
  borderRadius: 4,
};
const badgeWarn: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  background: "#fef3c7",
  color: "#b45309",
  padding: "2px 6px",
  borderRadius: 4,
};
const detailPanel: CSSProperties = {
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
const detailHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: "1px solid #f1f5f9",
};
const metaRow: CSSProperties = {
  display: "flex",
  gap: 8,
  fontSize: 12,
  padding: "3px 0",
};
const metaLabel: CSSProperties = { width: 92, color: "#64748b", flexShrink: 0 };
const metaValue: CSSProperties = { color: "#0f172a", wordBreak: "break-all" };
const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
  marginTop: 16,
  marginBottom: 6,
};
const pre: CSSProperties = {
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
const breadcrumbRow: CSSProperties = {
  display: "flex",
  gap: 8,
  fontSize: 11,
  padding: "3px 6px",
  background: "#f8fafc",
  borderRadius: 4,
  alignItems: "baseline",
};
const breadcrumbCategory: CSSProperties = {
  fontWeight: 700,
  color: "#3b82f6",
  minWidth: 80,
};
