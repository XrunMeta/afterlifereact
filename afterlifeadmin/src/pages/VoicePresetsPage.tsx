

import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";

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

const v_ce6ae5 = {
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

function v_90f011(v_81e2ef): EditDraft {
  return {
    name: v_81e2ef.name,
    name_en: v_81e2ef.name_en ?? "",
    name_ja: v_81e2ef.name_ja ?? "",
    name_zh_cn: v_81e2ef.name_zh_cn ?? "",
    name_id: v_81e2ef.name_id ?? "",
    gender: v_81e2ef.gender ?? "",
    age_range: v_81e2ef.age_range ?? "",
    description: v_81e2ef.description ?? "",
    sort_order: String(v_81e2ef.sort_order),
    is_active: v_81e2ef.is_active === 1,
    r2_key: v_81e2ef.r2_key ?? "",
    se_key: v_81e2ef.se_key ?? "",
  };
}

function v_eb4d73(v_d5dda0) {
  const v_68b2be = (v_fd5f43) => (v_fd5f43.trim() === "" ? null : v_fd5f43.trim());
  return {
    name: v_d5dda0.name.trim(),
    name_en: v_68b2be(v_d5dda0.name_en),
    name_ja: v_68b2be(v_d5dda0.name_ja),
    name_zh_cn: v_68b2be(v_d5dda0.name_zh_cn),
    name_id: v_68b2be(v_d5dda0.name_id),
    gender: v_68b2be(v_d5dda0.gender) ?? undefined,
    age_range: v_68b2be(v_d5dda0.age_range) ?? undefined,
    description: v_68b2be(v_d5dda0.description) ?? undefined,
    sort_order: Number.isFinite(Number(v_d5dda0.sort_order)) ? Number(v_d5dda0.sort_order) : 100,
    is_active: (v_d5dda0.is_active ? 1 : 0) as 0 | 1,
    r2_key: v_68b2be(v_d5dda0.r2_key) ?? undefined,
    se_key: v_68b2be(v_d5dda0.se_key) ?? undefined,
  };
}

export function v_9febbb() {
  const [v_18b8bf, v_586294] = v_5ab095<VoicePreset[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_8b56ae, v_d3cb17] = v_5ab095<number | "new" | null>(null);
  const [v_f04727, v_a07441] = v_5ab095<EditDraft>(v_ce6ae5);
  const [v_35bf26, v_04e389] = v_5ab095(false);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_3a7d09(null);
    v_05a921
      .getVoicePresets()
      .then((v_d5dda0) => v_586294(v_d5dda0.voices ?? []))
      .catch((v_9e86fd) => v_3a7d09(v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd)))
      .finally(() => v_34a50a(false));
  };
  v_c4deb2(v_f6f5de, []);

  const v_37e050 = (v_81e2ef) => {
    v_d3cb17(v_81e2ef.id);
    v_a07441(v_90f011(v_81e2ef));
  };
  const v_5c6b45 = () => {
    v_d3cb17("new");
    v_a07441(v_ce6ae5);
  };
  const v_c9de79 = () => {
    v_d3cb17(null);
    v_a07441(v_ce6ae5);
  };

  const v_1e693b = async () => {
    if (!v_f04727.name.trim()) {
      v_3a7d09("한국어 이름(name)은 필수입니다.");
      return;
    }
    v_04e389(true);
    v_3a7d09(null);
    try {
      const v_4d33b2 = v_eb4d73(v_f04727);
      if (v_8b56ae === "new") {
        await v_05a921.createVoicePreset(v_4d33b2);
      } else if (typeof v_8b56ae === "number") {
        await v_05a921.updateVoicePreset(v_8b56ae, v_4d33b2);
      }
      v_d3cb17(null);
      v_a07441(v_ce6ae5);
      v_f6f5de();
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    } finally {
      v_04e389(false);
    }
  };

  const v_b4f765 = async (v_81e2ef) => {
    if (!confirm(`"${v_81e2ef.name}" 을(를) 비활성화하시겠습니까? (soft delete)`)) return;
    v_3a7d09(null);
    try {
      await v_05a921.updateVoicePreset(v_81e2ef.id, { is_active: 0 });
      v_f6f5de();
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    }
  };
  const v_8c23a9 = async (v_81e2ef) => {
    v_3a7d09(null);
    try {
      await v_05a921.updateVoicePreset(v_81e2ef.id, { is_active: 1 });
      v_f6f5de();
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd instanceof Error ? v_9e86fd.message : String(v_9e86fd));
    }
  };

  return (
    <div style={v_d81136.container}>
      <div style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>음색 카탈로그 (다국어)</h1>
          <p style={v_d81136.desc}>
            앱 사용자에게 보여줄 음색 이름을 언어별로 관리합니다. 언어별 필드가 비어 있으면 앱은 한국어 이름(name)으로 폴백합니다.
          </p>
        </div>
        {v_8b56ae === null && (
          <button onClick={v_5c6b45} style={v_d81136.primaryBtn}>+ 새 음색 등록</button>
        )}
      </div>

      {v_5e9bfe && <div style={v_d81136.errorBox}>{v_5e9bfe}</div>}

      {v_8b56ae !== null && (
        <div style={v_d81136.editCard}>
          <h2 style={v_d81136.editTitle}>
            {v_8b56ae === "new" ? "새 음색 등록" : `#${v_8b56ae} 수정`}
          </h2>

          <div style={v_d81136.grid2}>
            <Field label="이름 (한국어 · 정본/fallback) *" required>
              <input
                style={v_d81136.input}
                value={v_f04727.name}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, name: v_9e86fd.target.value })}
                placeholder="예: 고민주"
              />
            </Field>
            <Field label="정렬 순서 (sort_order)">
              <input
                style={v_d81136.input}
                type="number"
                value={v_f04727.sort_order}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, sort_order: v_9e86fd.target.value })}
              />
            </Field>
          </div>

          <div style={v_d81136.sectionTitle}>다국어 이름</div>
          <div style={v_d81136.grid2}>
            <Field label="English (name_en)">
              <input
                style={v_d81136.input}
                value={v_f04727.name_en}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, name_en: v_9e86fd.target.value })}
                placeholder="e.g. Minju Ko"
              />
            </Field>
            <Field label="日本語 (name_ja)">
              <input
                style={v_d81136.input}
                value={v_f04727.name_ja}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, name_ja: v_9e86fd.target.value })}
                placeholder="例: ミンジュ"
              />
            </Field>
            <Field label="简体中文 (name_zh_cn)">
              <input
                style={v_d81136.input}
                value={v_f04727.name_zh_cn}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, name_zh_cn: v_9e86fd.target.value })}
                placeholder="例: 高敏珠"
              />
            </Field>
            <Field label="Bahasa Indonesia (name_id)">
              <input
                style={v_d81136.input}
                value={v_f04727.name_id}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, name_id: v_9e86fd.target.value })}
                placeholder="mis. Minju"
              />
            </Field>
          </div>

          <div style={v_d81136.sectionTitle}>메타</div>
          <div style={v_d81136.grid2}>
            <Field label="성별 (gender)">
              <input
                style={v_d81136.input}
                value={v_f04727.gender}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, gender: v_9e86fd.target.value })}
                placeholder="female / male / neutral"
              />
            </Field>
            <Field label="연령대 (age_range)">
              <input
                style={v_d81136.input}
                value={v_f04727.age_range}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, age_range: v_9e86fd.target.value })}
                placeholder="20s / 30s / …"
              />
            </Field>
          </div>
          <Field label="설명 (description)">
            <textarea
              style={{ ...v_d81136.input, minHeight: 60 }}
              value={v_f04727.description}
              onChange={(v_9e86fd) => v_a07441({ ...v_f04727, description: v_9e86fd.target.value })}
              placeholder="음색 설명 (선택)"
            />
          </Field>

          <div style={v_d81136.sectionTitle}>파일 키</div>
          <div style={v_d81136.grid2}>
            <Field label="R2 key (샘플 오디오, voice/ 로 시작)">
              <input
                style={v_d81136.input}
                value={v_f04727.r2_key}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, r2_key: v_9e86fd.target.value })}
                placeholder="voice/sample/xxx.mp3"
              />
            </Field>
            <Field label="Se key (레거시)">
              <input
                style={v_d81136.input}
                value={v_f04727.se_key}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, se_key: v_9e86fd.target.value })}
                placeholder="레거시 se 식별자"
              />
            </Field>
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={v_d81136.checkboxLabel}>
              <input
                type="checkbox"
                checked={v_f04727.is_active}
                onChange={(v_9e86fd) => v_a07441({ ...v_f04727, is_active: v_9e86fd.target.checked })}
              />
              {" 활성화 (is_active)"}
            </label>
          </div>

          <div style={v_d81136.actionsRow}>
            <button onClick={v_1e693b} disabled={v_35bf26} style={v_d81136.primaryBtn}>
              {v_35bf26 ? "저장 중..." : v_8b56ae === "new" ? "등록" : "저장"}
            </button>
            <button onClick={v_c9de79} disabled={v_35bf26} style={v_d81136.secondaryBtn}>
              취소
            </button>
          </div>
        </div>
      )}

      {v_683210 ? (
        <div style={v_d81136.loading}>불러오는 중...</div>
      ) : (
        <div style={v_d81136.tableWrap}>
          <table style={v_d81136.table}>
            <thead>
              <tr>
                <th style={v_d81136.th}>ID</th>
                <th style={v_d81136.th}>한국어 (정본)</th>
                <th style={v_d81136.th}>EN</th>
                <th style={v_d81136.th}>JA</th>
                <th style={v_d81136.th}>ZH-CN</th>
                <th style={v_d81136.th}>ID</th>
                <th style={v_d81136.th}>gender</th>
                <th style={v_d81136.th}>age</th>
                <th style={v_d81136.th}>sort</th>
                <th style={v_d81136.th}>active</th>
                <th style={v_d81136.th}>액션</th>
              </tr>
            </thead>
            <tbody>
              {v_18b8bf.map((v_81e2ef) => (
                <tr key={v_81e2ef.id} style={v_81e2ef.is_active ? undefined : v_d81136.rowInactive}>
                  <td style={v_d81136.td}>{v_81e2ef.id}</td>
                  <td style={v_d81136.td}><b>{v_81e2ef.name}</b></td>
                  <td style={v_d81136.td}>{v_81e2ef.name_en || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.name_ja || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.name_zh_cn || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.name_id || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.gender || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.age_range || <span style={v_d81136.muted}>—</span>}</td>
                  <td style={v_d81136.td}>{v_81e2ef.sort_order}</td>
                  <td style={v_d81136.td}>{v_81e2ef.is_active ? "✅" : "🚫"}</td>
                  <td style={v_d81136.td}>
                    <button onClick={() => v_37e050(v_81e2ef)} style={v_d81136.smallBtn}>수정</button>
                    {v_81e2ef.is_active ? (
                      <button onClick={() => v_b4f765(v_81e2ef)} style={v_d81136.smallDangerBtn}>비활성</button>
                    ) : (
                      <button onClick={() => v_8c23a9(v_81e2ef)} style={v_d81136.smallBtn}>활성화</button>
                    )}
                  </td>
                </tr>
              ))}
              {v_18b8bf.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ ...v_d81136.td, textAlign: "center", color: "#94a3b8" }}>
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

function v_812f6e({
  label: v_2869c1,
  required: v_925940,
  children: v_21f619,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={v_d81136.fieldLabel}>
      <span style={{ fontWeight: 600, fontSize: 12, color: "#374151" }}>
        {v_2869c1}
        {v_925940 ? <span style={{ color: "#dc2626" }}> *</span> : null}
      </span>
      {v_21f619}
    </label>
  );
}

const v_d81136 = {
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
