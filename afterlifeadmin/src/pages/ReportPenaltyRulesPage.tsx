

import { v_c4deb2, v_5ab095, type v_bb76a8 } from "bapkr";
import { v_05a921 } from "../api/client";

interface Rule {
  threshold: number;
  action: "warn" | "suspend";
  suspendDays: number | null;
  updatedAt?: string;
}

const v_599603 = [
  { days: 7, label: "일주일 정지" },
  { days: 30, label: "한달 정지" },
  { days: 90, label: "3개월 정지" },
];

function v_f80085(v_cb35cb): string {
  if (v_cb35cb.action === "warn") return "경고만";
  const v_324e3c = v_599603.find((v_e2a85c) => v_e2a85c.days === v_cb35cb.suspendDays);
  return v_324e3c ? v_324e3c.label : `${v_cb35cb.suspendDays}일 활동 정지`;
}

export function v_62d6e0() {
  const [v_ddf1dc, v_418363] = v_5ab095<Rule[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_b0f3e9, v_0c199c] = v_5ab095<number | null>(null);

  const [v_94bcdc, v_5ba5f7] = v_5ab095<number>(1);
  const [v_0a0434, v_82101b] = v_5ab095<"warn" | "suspend">("warn");
  const [v_fbff8d, v_980fdc] = v_5ab095<number>(7);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921
      .getReportPenaltyRules()
      .then((v_cb35cb) => v_418363(v_cb35cb.items))
      .catch((v_49263d) => console.error("getReportPenaltyRules failed:", v_49263d))
      .finally(() => v_34a50a(false));
  };
  v_c4deb2(v_f6f5de, []);

  const v_9b35cb = async (v_d361d7, v_9b064f, v_141abe) => {
    v_0c199c(v_d361d7);
    try {
      await v_05a921.putReportPenaltyRule(v_d361d7, {
        action: v_9b064f,
        suspendDays: v_9b064f === "suspend" ? v_141abe : null,
      });
      v_f6f5de();
    } catch (v_49263d) {
      console.error("putReportPenaltyRule failed:", v_49263d);
      alert("저장에 실패했어요.");
    } finally {
      v_0c199c(null);
    }
  };

  const v_6dd826 = async (v_d361d7) => {
    if (!confirm(`신고 ${v_d361d7}회 규칙을 삭제할까요?`)) return;
    try {
      await v_05a921.deleteReportPenaltyRule(v_d361d7);
      v_f6f5de();
    } catch (v_49263d) {
      console.error("deleteReportPenaltyRule failed:", v_49263d);
    }
  };

  const v_7ab5e9 = (v_d361d7, v_17dc8a) => {
    v_418363((v_ba2215) => v_ba2215.map((v_cb35cb) => (v_cb35cb.threshold === v_d361d7 ? { ...v_cb35cb, ...v_17dc8a } : v_cb35cb)));
  };

  const v_445558 = new Set(v_ddf1dc.map((v_cb35cb) => v_cb35cb.threshold));

  return (
    <div>
      <header style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>신고 누적 조건</h1>
          <p style={v_d81136.sub}>
            신고(경고) 누적 횟수에 따른 벌칙을 설정해요. 활동 정지 시 앱에서 페르소나 생성이
            차단됩니다(구경은 가능). 누적 횟수에 해당하는 가장 높은 규칙이 적용돼요.
          </p>
        </div>
        <button onClick={v_f6f5de} style={v_d81136.refreshBtn}>새로고침</button>
      </header>

      {v_683210 ? (
        <p>로딩 중...</p>
      ) : (
        <div style={v_d81136.tableWrap}>
          <table style={v_d81136.table}>
            <thead>
              <tr style={v_d81136.theadRow}>
                <th style={v_d81136.th}>신고 누적 횟수</th>
                <th style={v_d81136.th}>벌칙</th>
                <th style={v_d81136.th}>정지 일수</th>
                <th style={v_d81136.th}>요약</th>
                <th style={v_d81136.th}>액션</th>
              </tr>
            </thead>
            <tbody>
              {v_ddf1dc.map((v_cb35cb) => (
                <tr key={v_cb35cb.threshold} style={v_d81136.tr}>
                  <td style={v_d81136.td}><b>{v_cb35cb.threshold}회</b></td>
                  <td style={v_d81136.td}>
                    <select
                      value={v_cb35cb.action}
                      onChange={(v_9e86fd) =>
                        v_7ab5e9(v_cb35cb.threshold, { action: v_9e86fd.target.value as "warn" | "suspend" })
                      }
                      style={v_d81136.select}
                    >
                      <option value="warn">경고만</option>
                      <option value="suspend">활동 정지</option>
                    </select>
                  </td>
                  <td style={v_d81136.td}>
                    {v_cb35cb.action === "suspend" ? (
                      <select
                        value={v_cb35cb.suspendDays ?? 7}
                        onChange={(v_9e86fd) => v_7ab5e9(v_cb35cb.threshold, { suspendDays: Number(v_9e86fd.target.value) })}
                        style={v_d81136.select}
                      >
                        {v_599603.map((v_e2a85c) => (
                          <option key={v_e2a85c.days} value={v_e2a85c.days}>{v_e2a85c.days}일 ({v_e2a85c.label})</option>
                        ))}
                        {v_cb35cb.suspendDays != null &&
                          !v_599603.some((v_e2a85c) => v_e2a85c.days === v_cb35cb.suspendDays) && (
                            <option value={v_cb35cb.suspendDays}>{v_cb35cb.suspendDays}일</option>
                          )}
                      </select>
                    ) : (
                      <span style={v_d81136.dim}>—</span>
                    )}
                  </td>
                  <td style={v_d81136.td}>{v_f80085(v_cb35cb)}</td>
                  <td style={v_d81136.td}>
                    <button
                      onClick={() => v_9b35cb(v_cb35cb.threshold, v_cb35cb.action, v_cb35cb.suspendDays)}
                      disabled={v_b0f3e9 === v_cb35cb.threshold}
                      style={v_d81136.saveBtn}
                    >
                      저장
                    </button>
                    <button onClick={() => v_6dd826(v_cb35cb.threshold)} style={v_d81136.delBtn}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {}
          <div style={v_d81136.addBox}>
            <span style={v_d81136.addTitle}>규칙 추가</span>
            <span>신고</span>
            <input
              type="number"
              min={1}
              max={50}
              value={v_94bcdc}
              onChange={(v_9e86fd) => v_5ba5f7(Number(v_9e86fd.target.value))}
              style={v_d81136.numInput}
            />
            <span>회 →</span>
            <select
              value={v_0a0434}
              onChange={(v_9e86fd) => v_82101b(v_9e86fd.target.value as "warn" | "suspend")}
              style={v_d81136.select}
            >
              <option value="warn">경고만</option>
              <option value="suspend">활동 정지</option>
            </select>
            {v_0a0434 === "suspend" && (
              <select value={v_fbff8d} onChange={(v_9e86fd) => v_980fdc(Number(v_9e86fd.target.value))} style={v_d81136.select}>
                {v_599603.map((v_e2a85c) => (
                  <option key={v_e2a85c.days} value={v_e2a85c.days}>{v_e2a85c.days}일 ({v_e2a85c.label})</option>
                ))}
              </select>
            )}
            <button
              onClick={() => v_9b35cb(v_94bcdc, v_0a0434, v_fbff8d)}
              disabled={v_b0f3e9 === v_94bcdc}
              style={v_d81136.addBtn}
            >
              {v_445558.has(v_94bcdc) ? "덮어쓰기" : "추가"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, v_bb76a8> = {
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 },
  title: { margin: 0, fontSize: 24, color: "#0f172a" },
  sub: { margin: "4px 0 0", color: "#64748b", fontSize: 13, maxWidth: 640, lineHeight: 1.5 },
  refreshBtn: { padding: "8px 14px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" },
  tableWrap: { backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { backgroundColor: "#f8fafc" },
  th: { padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px", fontSize: 13, color: "#0f172a" },
  select: { padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" },
  numInput: { width: 60, padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 },
  dim: { color: "#94a3b8" },
  saveBtn: { padding: "6px 12px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", marginRight: 6 },
  delBtn: { padding: "6px 12px", backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" },
  addBox: { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderTop: "2px solid #e2e8f0", fontSize: 13, color: "#334155", flexWrap: "wrap" },
  addTitle: { fontWeight: 700, marginRight: 8 },
  addBtn: { padding: "6px 14px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" },
};
