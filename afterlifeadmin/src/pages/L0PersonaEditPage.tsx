import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_383169 } from "../lib/auth";

export function v_6c8b30() {
  const [v_f9ca29, v_62c737] = v_5ab095("");
  const [v_33f5f0, v_91edf7] = v_5ab095<string[]>([]);
  const [v_0ea3ab, v_bffdf7] = v_5ab095("");
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_39de0e, v_e63d06] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_727031 = v_383169();
  const v_c0d0b6 = v_727031?.role === "super_admin";

  v_c4deb2(() => {
    v_05a921
      .getSystemPersona()
      .then((v_d5dda0) => {
        v_62c737(v_d5dda0.rules_text ?? "");
        v_91edf7(v_d5dda0.blocklist ?? []);
      })
      .catch((v_9e86fd) => {
        const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd);
        v_3a7d09(v_badeaf);
      })
      .finally(() => v_34a50a(false));
  }, []);

  const v_8fbb37 = () => {
    const v_81e2ef = v_0ea3ab.trim();
    if (v_81e2ef) {
      v_91edf7([...v_33f5f0, v_81e2ef]);
      v_bffdf7("");
    }
  };

  const v_76d3b7 = (v_9e86fd) => {
    if (v_9e86fd.key === "Enter") v_8fbb37();
  };

  const v_2039ec = (v_ebec57) =>
    v_91edf7(v_33f5f0.filter((v_37eab7, v_e86ad8) => v_e86ad8 !== v_ebec57));

  const v_1e693b = async () => {
    v_e63d06(false);
    v_3a7d09(null);
    v_04e389(true);
    try {
      await v_05a921.updateSystemPersona({ rules_text: v_f9ca29, blocklist: v_33f5f0 });
      v_e63d06(true);
    } catch (v_9e86fd) {
      const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd);
      v_3a7d09(v_badeaf);
    } finally {
      v_04e389(false);
    }
  };

  if (v_683210) return <div style={v_d81136.loading}>Loading...</div>;

  return (
    <div style={v_d81136.container}>
      <div style={v_d81136.header}>
        <h1 style={v_d81136.title}>L0 시스템 페르소나</h1>
        <p style={v_d81136.desc}>
          모든 클론에 공통 적용되는 안전·행동 규칙입니다.
          {!v_c0d0b6 && (
            <span style={v_d81136.readonlyBadge}> (읽기 전용 — 수정은 super_admin 권한 필요)</span>
          )}
        </p>
      </div>

      {v_5e9bfe && <div style={v_d81136.errorBox}>{v_5e9bfe}</div>}

      <div style={v_d81136.section}>
        <label style={v_d81136.label}>규칙 (rules_text)</label>
        <textarea
          value={v_f9ca29}
          onChange={(v_9e86fd) => v_62c737(v_9e86fd.target.value)}
          disabled={!v_c0d0b6}
          style={{ ...v_d81136.textarea, ...(v_c0d0b6 ? {} : v_d81136.disabled) }}
        />
      </div>

      <div style={v_d81136.section}>
        <label style={v_d81136.label}>금칙어 (blocklist)</label>
        {v_c0d0b6 && (
          <div style={v_d81136.addRow}>
            <input
              value={v_0ea3ab}
              onChange={(v_9e86fd) => v_bffdf7(v_9e86fd.target.value)}
              onKeyDown={v_76d3b7}
              placeholder="단어 입력 후 추가 또는 Enter"
              style={v_d81136.input}
            />
            <button onClick={v_8fbb37} style={v_d81136.addBtn}>
              추가
            </button>
          </div>
        )}
        <ul style={v_d81136.list}>
          {v_33f5f0.length === 0 && (
            <li style={v_d81136.emptyItem}>등록된 금칙어 없음</li>
          )}
          {v_33f5f0.map((v_32f7b8, v_ebec57) => (
            <li key={v_ebec57} style={v_d81136.listItem}>
              <span style={v_d81136.word}>{v_32f7b8}</span>
              {v_c0d0b6 && (
                <button onClick={() => v_2039ec(v_ebec57)} style={v_d81136.removeBtn}>
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {v_c0d0b6 && (
        <div style={v_d81136.saveRow}>
          <button
            onClick={v_1e693b}
            disabled={v_35bf26}
            style={{ ...v_d81136.saveBtn, ...(v_35bf26 ? v_d81136.saveBtnDisabled : {}) }}
          >
            {v_35bf26 ? "저장 중..." : "저장"}
          </button>
          {v_39de0e && <span style={v_d81136.savedMsg}>저장됨</span>}
        </div>
      )}
    </div>
  );
}

const v_d81136 = {
  container: {
    maxWidth: 800,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  desc: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },
  readonlyBadge: {
    color: "#f59e0b",
    fontWeight: 600,
  },
  loading: {
    padding: 32,
    color: "#64748b",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "10px 14px",
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    padding: "10px 12px",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 1.6,
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#0f172a",
    resize: "vertical",
    boxSizing: "border-box",
  },
  disabled: {
    backgroundColor: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: "7px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 13,
    color: "#0f172a",
  },
  addBtn: {
    padding: "7px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  emptyItem: {
    fontSize: 13,
    color: "#94a3b8",
    padding: "8px 0",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  word: {
    fontSize: 13,
    color: "#1e293b",
    fontFamily: "monospace",
  },
  removeBtn: {
    padding: "3px 10px",
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #fca5a5",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    padding: "9px 24px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtnDisabled: {
    backgroundColor: "#93c5fd",
    cursor: "not-allowed",
  },
  savedMsg: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: 600,
  },
};
