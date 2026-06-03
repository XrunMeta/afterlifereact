import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getProfile } from "../lib/auth";

export function L0PersonaEditPage() {
  const [rulesText, setRulesText] = useState("");
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = getProfile();
  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    api
      .getSystemPersona()
      .then((d) => {
        setRulesText(d.rules_text ?? "");
        setBlocklist(d.blocklist ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    const v = newItem.trim();
    if (v) {
      setBlocklist([...blocklist, v]);
      setNewItem("");
    }
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addItem();
  };

  const removeItem = (i: number) =>
    setBlocklist(blocklist.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      await api.updateSystemPersona({ rules_text: rulesText, blocklist });
      setSaved(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>L0 시스템 페르소나</h1>
        <p style={styles.desc}>
          모든 클론에 공통 적용되는 안전·행동 규칙입니다.
          {!isSuperAdmin && (
            <span style={styles.readonlyBadge}> (읽기 전용 — 수정은 super_admin 권한 필요)</span>
          )}
        </p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.section}>
        <label style={styles.label}>규칙 (rules_text)</label>
        <textarea
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          disabled={!isSuperAdmin}
          style={{ ...styles.textarea, ...(isSuperAdmin ? {} : styles.disabled) }}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>금칙어 (blocklist)</label>
        {isSuperAdmin && (
          <div style={styles.addRow}>
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleNewItemKeyDown}
              placeholder="단어 입력 후 추가 또는 Enter"
              style={styles.input}
            />
            <button onClick={addItem} style={styles.addBtn}>
              추가
            </button>
          </div>
        )}
        <ul style={styles.list}>
          {blocklist.length === 0 && (
            <li style={styles.emptyItem}>등록된 금칙어 없음</li>
          )}
          {blocklist.map((w, i) => (
            <li key={i} style={styles.listItem}>
              <span style={styles.word}>{w}</span>
              {isSuperAdmin && (
                <button onClick={() => removeItem(i)} style={styles.removeBtn}>
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isSuperAdmin && (
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
      )}
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
