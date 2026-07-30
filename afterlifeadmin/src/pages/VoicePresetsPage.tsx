

import { useEffect, useState } from "react";
import { api } from "../api/client";

type VoicePreset = {
  id: number;
  name: string;
  name_en: string | null;
  name_ja: string | null;
  name_zh_cn: string | null;
  name_id: string | null;
  gender: string | null;
  age_range: string | null;
  description: string | null;
  sort_order: number;
  is_active: 0 | 1;
  r2_key: string | null;
  se_key: string | null;
};

type EditDraft = {
  name: string;
  name_en: string;
  name_ja: string;
  name_zh_cn: string;
  name_id: string;
  gender: string;
  age_range: string;
  description: string;
  sort_order: string;
  is_active: boolean;
  r2_key: string;
  se_key: string;
};

const emptyDraft: EditDraft = {
  name: "",
  name_en: "",
  name_ja: "",
  name_zh_cn: "",
  name_id: "",
  gender: "",
  age_range: "",
  description: "",
  sort_order: "100",
  is_active: true,
  r2_key: "",
  se_key: "",
};

function toDraft(v: VoicePreset): EditDraft {
  return {
    name: v.name,
    name_en: v.name_en ?? "",
    name_ja: v.name_ja ?? "",
    name_zh_cn: v.name_zh_cn ?? "",
    name_id: v.name_id ?? "",
    gender: v.gender ?? "",
    age_range: v.age_range ?? "",
    description: v.description ?? "",
    sort_order: String(v.sort_order),
    is_active: v.is_active === 1,
    r2_key: v.r2_key ?? "",
    se_key: v.se_key ?? "",
  };
}

function draftToBody(d: EditDraft) {
  const opt = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    name: d.name.trim(),
    name_en: opt(d.name_en),
    name_ja: opt(d.name_ja),
    name_zh_cn: opt(d.name_zh_cn),
    name_id: opt(d.name_id),
    gender: opt(d.gender) ?? undefined,
    age_range: opt(d.age_range) ?? undefined,
    description: opt(d.description) ?? undefined,
    sort_order: Number.isFinite(Number(d.sort_order)) ? Number(d.sort_order) : 100,
    is_active: (d.is_active ? 1 : 0) as 0 | 1,
    r2_key: opt(d.r2_key) ?? undefined,
    se_key: opt(d.se_key) ?? undefined,
  };
}

export function VoicePresetsPage() {
  const [rows, setRows] = useState<VoicePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getVoicePresets()
      .then((d) => setRows(d.voices ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startEdit = (v: VoicePreset) => {
    setEditingId(v.id);
    setDraft(toDraft(v));
  };
  const startNew = () => {
    setEditingId("new");
    setDraft(emptyDraft);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError("한국어 이름(name)은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = draftToBody(draft);
      if (editingId === "new") {
        await api.createVoicePreset(body);
      } else if (typeof editingId === "number") {
        await api.updateVoicePreset(editingId, body);
      }
      setEditingId(null);
      setDraft(emptyDraft);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async (v: VoicePreset) => {
    if (!confirm(`"${v.name}" 을(를) 비활성화하시겠습니까? (soft delete)`)) return;
    setError(null);
    try {
      await api.updateVoicePreset(v.id, { is_active: 0 });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const reactivate = async (v: VoicePreset) => {
    setError(null);
    try {
      await api.updateVoicePreset(v.id, { is_active: 1 });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>음색 카탈로그 (다국어)</h1>
          <p style={styles.desc}>
            앱 사용자에게 보여줄 음색 이름을 언어별로 관리합니다. 언어별 필드가 비어 있으면 앱은 한국어 이름(name)으로 폴백합니다.
          </p>
        </div>
        {editingId === null && (
          <button onClick={startNew} style={styles.primaryBtn}>+ 새 음색 등록</button>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {editingId !== null && (
        <div style={styles.editCard}>
          <h2 style={styles.editTitle}>
            {editingId === "new" ? "새 음색 등록" : `#${editingId} 수정`}
          </h2>

          <div style={styles.grid2}>
            <Field label="이름 (한국어 · 정본/fallback) *" required>
              <input
                style={styles.input}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="예: 고민주"
              />
            </Field>
            <Field label="정렬 순서 (sort_order)">
              <input
                style={styles.input}
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
              />
            </Field>
          </div>

          <div style={styles.sectionTitle}>다국어 이름</div>
          <div style={styles.grid2}>
            <Field label="English (name_en)">
              <input
                style={styles.input}
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                placeholder="e.g. Minju Ko"
              />
            </Field>
            <Field label="日本語 (name_ja)">
              <input
                style={styles.input}
                value={draft.name_ja}
                onChange={(e) => setDraft({ ...draft, name_ja: e.target.value })}
                placeholder="例: ミンジュ"
              />
            </Field>
            <Field label="简体中文 (name_zh_cn)">
              <input
                style={styles.input}
                value={draft.name_zh_cn}
                onChange={(e) => setDraft({ ...draft, name_zh_cn: e.target.value })}
                placeholder="例: 高敏珠"
              />
            </Field>
            <Field label="Bahasa Indonesia (name_id)">
              <input
                style={styles.input}
                value={draft.name_id}
                onChange={(e) => setDraft({ ...draft, name_id: e.target.value })}
                placeholder="mis. Minju"
              />
            </Field>
          </div>

          <div style={styles.sectionTitle}>메타</div>
          <div style={styles.grid2}>
            <Field label="성별 (gender)">
              <input
                style={styles.input}
                value={draft.gender}
                onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                placeholder="female / male / neutral"
              />
            </Field>
            <Field label="연령대 (age_range)">
              <input
                style={styles.input}
                value={draft.age_range}
                onChange={(e) => setDraft({ ...draft, age_range: e.target.value })}
                placeholder="20s / 30s / …"
              />
            </Field>
          </div>
          <Field label="설명 (description)">
            <textarea
              style={{ ...styles.input, minHeight: 60 }}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="음색 설명 (선택)"
            />
          </Field>

          <div style={styles.sectionTitle}>파일 키</div>
          <div style={styles.grid2}>
            <Field label="R2 key (샘플 오디오, voice/ 로 시작)">
              <input
                style={styles.input}
                value={draft.r2_key}
                onChange={(e) => setDraft({ ...draft, r2_key: e.target.value })}
                placeholder="voice/sample/xxx.mp3"
              />
            </Field>
            <Field label="Se key (레거시)">
              <input
                style={styles.input}
                value={draft.se_key}
                onChange={(e) => setDraft({ ...draft, se_key: e.target.value })}
                placeholder="레거시 se 식별자"
              />
            </Field>
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
              {" 활성화 (is_active)"}
            </label>
          </div>

          <div style={styles.actionsRow}>
            <button onClick={save} disabled={saving} style={styles.primaryBtn}>
              {saving ? "저장 중..." : editingId === "new" ? "등록" : "저장"}
            </button>
            <button onClick={cancelEdit} disabled={saving} style={styles.secondaryBtn}>
              취소
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>불러오는 중...</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>한국어 (정본)</th>
                <th style={styles.th}>EN</th>
                <th style={styles.th}>JA</th>
                <th style={styles.th}>ZH-CN</th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>gender</th>
                <th style={styles.th}>age</th>
                <th style={styles.th}>sort</th>
                <th style={styles.th}>active</th>
                <th style={styles.th}>액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} style={v.is_active ? undefined : styles.rowInactive}>
                  <td style={styles.td}>{v.id}</td>
                  <td style={styles.td}><b>{v.name}</b></td>
                  <td style={styles.td}>{v.name_en || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.name_ja || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.name_zh_cn || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.name_id || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.gender || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.age_range || <span style={styles.muted}>—</span>}</td>
                  <td style={styles.td}>{v.sort_order}</td>
                  <td style={styles.td}>{v.is_active ? "✅" : "🚫"}</td>
                  <td style={styles.td}>
                    <button onClick={() => startEdit(v)} style={styles.smallBtn}>수정</button>
                    {v.is_active ? (
                      <button onClick={() => softDelete(v)} style={styles.smallDangerBtn}>비활성</button>
                    ) : (
                      <button onClick={() => reactivate(v)} style={styles.smallBtn}>활성화</button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                    등록된 음색이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.fieldLabel}>
      <span style={{ fontWeight: 600, fontSize: 12, color: "#374151" }}>
        {label}
        {required ? <span style={{ color: "#dc2626" }}> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1200 },
  header: {
    marginBottom: 20,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  desc: { fontSize: 13, color: "#64748b", margin: 0, maxWidth: 700 },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "10px 14px",
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 16,
  },
  loading: { padding: 32, color: "#64748b", fontSize: 14 },
  primaryBtn: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  smallBtn: {
    padding: "4px 10px",
    marginRight: 4,
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
  smallDangerBtn: {
    padding: "4px 10px",
    marginRight: 4,
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
  editCard: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 24,
  },
  editTitle: { margin: "0 0 16px", fontSize: 16, color: "#0f172a", fontWeight: 700 },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  fieldLabel: { display: "flex", flexDirection: "column", gap: 4 },
  input: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    boxSizing: "border-box",
    color: "#0f172a",
    backgroundColor: "#fff",
    fontFamily: "inherit",
  },
  checkboxLabel: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#0f172a" },
  actionsRow: { display: "flex", gap: 8, marginTop: 16 },
  tableWrap: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    overflowX: "auto",
    backgroundColor: "#fff",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontWeight: 600,
    color: "#334155",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  muted: { color: "#cbd5e1" },
  rowInactive: { opacity: 0.5, backgroundColor: "#f8fafc" },
};
