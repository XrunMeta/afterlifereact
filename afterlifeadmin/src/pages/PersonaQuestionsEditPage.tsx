import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";

export function v_394bcd() {
  const [v_9b6134, v_43d2ef] = v_5ab095("");
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_39de0e, v_e63d06] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    v_05a921
      .getPersonaQuestions()
      .then((v_d5dda0) => v_43d2ef(JSON.stringify(v_d5dda0.questions, null, 2)))
      .catch((v_9e86fd) => {
        const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd);
        v_3a7d09(v_badeaf);
      })
      .finally(() => v_34a50a(false));
  }, []);

  const v_1e693b = async () => {
    v_3a7d09(null);
    v_e63d06(false);
    let v_8decf8;
    try {
      v_8decf8 = JSON.parse(v_9b6134);
    } catch {
      v_3a7d09("JSON 파싱 실패 — 형식을 확인하세요.");
      return;
    }
    v_04e389(true);
    try {
      await v_05a921.updatePersonaQuestions({ questions: v_8decf8 as unknown[] });
      v_e63d06(true);
    } catch (v_9e86fd) {
      const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd);
      v_3a7d09(v_badeaf); 
    } finally {
      v_04e389(false);
    }
  };

  if (v_683210) return <div style={v_d81136.loading}>불러오는 중...</div>;

  return (
    <div style={v_d81136.container}>
      <div style={v_d81136.header}>
        <h1 style={v_d81136.title}>페르소나 도우미 질문</h1>
        <p style={v_d81136.desc}>
          질문 스키마(JSON 배열). type: gemma_choice | fixed_choice | text.
          fixed_choice는 options 필수. showWhen으로 조건부 표시.
        </p>
      </div>

      {v_5e9bfe && <div style={v_d81136.errorBox}>{v_5e9bfe}</div>}

      <div style={v_d81136.section}>
        <label style={v_d81136.label}>질문 스키마 (questions)</label>
        <textarea
          value={v_9b6134}
          onChange={(v_9e86fd) => v_43d2ef(v_9e86fd.target.value)}
          style={v_d81136.textarea}
        />
      </div>

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
    minHeight: 420,
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
