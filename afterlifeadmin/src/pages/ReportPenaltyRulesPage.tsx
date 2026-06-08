

import { useEffect, useState, type CSSProperties } from "react";
import { api } from "../api/client";

interface Rule {
  threshold: number;
  action: "warn" | "suspend";
  suspendDays: number | null;
  updatedAt?: string;
}

const DAY_PRESETS = [
  { days: 7, label: "일주일 정지" },
  { days: 30, label: "한달 정지" },
  { days: 90, label: "3개월 정지" },
];

function describeRule(r: Rule): string {
  if (r.action === "warn") return "경고만";
  const preset = DAY_PRESETS.find((p) => p.days === r.suspendDays);
  return preset ? preset.label : `${r.suspendDays}일 활동 정지`;
}

export function ReportPenaltyRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<number | null>(null);

  const [newThreshold, setNewThreshold] = useState<number>(1);
  const [newAction, setNewAction] = useState<"warn" | "suspend">("warn");
  const [newDays, setNewDays] = useState<number>(7);

  const load = () => {
    setLoading(true);
    api
      .getReportPenaltyRules()
      .then((r) => setRules(r.items))
      .catch((err) => console.error("getReportPenaltyRules failed:", err))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const saveRule = async (threshold: number, action: "warn" | "suspend", suspendDays: number | null) => {
    setSavingKey(threshold);
    try {
      await api.putReportPenaltyRule(threshold, {
        action,
        suspendDays: action === "suspend" ? suspendDays : null,
      });
      load();
    } catch (err) {
      console.error("putReportPenaltyRule failed:", err);
      alert("저장에 실패했어요.");
    } finally {
      setSavingKey(null);
    }
  };

  const removeRule = async (threshold: number) => {
    if (!confirm(`신고 ${threshold}회 규칙을 삭제할까요?`)) return;
    try {
      await api.deleteReportPenaltyRule(threshold);
      load();
    } catch (err) {
      console.error("deleteReportPenaltyRule failed:", err);
    }
  };

  const updateLocal = (threshold: number, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.threshold === threshold ? { ...r, ...patch } : r)));
  };

  const existingThresholds = new Set(rules.map((r) => r.threshold));

  return (
    <div>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>신고 누적 조건</h1>
          <p style={styles.sub}>
            신고(경고) 누적 횟수에 따른 벌칙을 설정해요. 활동 정지 시 앱에서 페르소나 생성이
            차단됩니다(구경은 가능). 누적 횟수에 해당하는 가장 높은 규칙이 적용돼요.
          </p>
        </div>
        <button onClick={load} style={styles.refreshBtn}>새로고침</button>
      </header>

      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>신고 누적 횟수</th>
                <th style={styles.th}>벌칙</th>
                <th style={styles.th}>정지 일수</th>
                <th style={styles.th}>요약</th>
                <th style={styles.th}>액션</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.threshold} style={styles.tr}>
                  <td style={styles.td}><b>{r.threshold}회</b></td>
                  <td style={styles.td}>
                    <select
                      value={r.action}
                      onChange={(e) =>
                        updateLocal(r.threshold, { action: e.target.value as "warn" | "suspend" })
                      }
                      style={styles.select}
                    >
                      <option value="warn">경고만</option>
                      <option value="suspend">활동 정지</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    {r.action === "suspend" ? (
                      <select
                        value={r.suspendDays ?? 7}
                        onChange={(e) => updateLocal(r.threshold, { suspendDays: Number(e.target.value) })}
                        style={styles.select}
                      >
                        {DAY_PRESETS.map((p) => (
                          <option key={p.days} value={p.days}>{p.days}일 ({p.label})</option>
                        ))}
                        {r.suspendDays != null &&
                          !DAY_PRESETS.some((p) => p.days === r.suspendDays) && (
                            <option value={r.suspendDays}>{r.suspendDays}일</option>
                          )}
                      </select>
                    ) : (
                      <span style={styles.dim}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>{describeRule(r)}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => saveRule(r.threshold, r.action, r.suspendDays)}
                      disabled={savingKey === r.threshold}
                      style={styles.saveBtn}
                    >
                      저장
                    </button>
                    <button onClick={() => removeRule(r.threshold)} style={styles.delBtn}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {}
          <div style={styles.addBox}>
            <span style={styles.addTitle}>규칙 추가</span>
            <span>신고</span>
            <input
              type="number"
              min={1}
              max={50}
              value={newThreshold}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
              style={styles.numInput}
            />
            <span>회 →</span>
            <select
              value={newAction}
              onChange={(e) => setNewAction(e.target.value as "warn" | "suspend")}
              style={styles.select}
            >
              <option value="warn">경고만</option>
              <option value="suspend">활동 정지</option>
            </select>
            {newAction === "suspend" && (
              <select value={newDays} onChange={(e) => setNewDays(Number(e.target.value))} style={styles.select}>
                {DAY_PRESETS.map((p) => (
                  <option key={p.days} value={p.days}>{p.days}일 ({p.label})</option>
                ))}
              </select>
            )}
            <button
              onClick={() => saveRule(newThreshold, newAction, newDays)}
              disabled={savingKey === newThreshold}
              style={styles.addBtn}
            >
              {existingThresholds.has(newThreshold) ? "덮어쓰기" : "추가"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
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
