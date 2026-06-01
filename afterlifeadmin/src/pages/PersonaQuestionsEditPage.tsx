import { useEffect, useState } from "react";
import { api } from "../api/client";

export function PersonaQuestionsEditPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPersonaQuestions()
      .then((d) => setText(JSON.stringify(d.questions, null, 2)))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setError(null);
    setSaved(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("JSON 파싱 실패 — 형식을 확인하세요.");
      return;
    }
    setSaving(true);
    try {
      await api.updatePersonaQuestions({ questions: parsed as unknown[] });
      setSaved(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg); 
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>페르소나 도우미 질문</h1>
        <p style={styles.desc}>
          질문 스키마(JSON 배열). type: gemma_choice | fixed_choice | text.
          fixed_choice는 options 필수. showWhen으로 조건부 표시.
        </p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.section}>
        <label style={styles.label}>질문 스키마 (questions)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.saveRow}>
        <button
          onClick={save}
          disabled={saving}
          style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && <span style={styles.savedMsg}>저장됨</span>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
