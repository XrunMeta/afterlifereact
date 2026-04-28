import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";

interface Stats {
  users: number;
  clones: number;
  messages: number;
  totalCredits: number;
}

const v_099696 = "https://edge-alt-preview.example.invalid";
const v_cf2122 = "https://edge-alt.example.invalid";
const v_b6c376 = "afterlife.admin.apiOverride";

function v_b5b25a(): string {
  try {
    return window.localStorage.getItem(v_b6c376) || (import.meta.env.VITE_API_URL ?? v_cf2122);
  } catch {
    return v_cf2122;
  }
}

function v_5a7e16(v_f71b56) {
  try {
    window.localStorage.setItem(v_b6c376, v_f71b56);
  } catch {

  }

}

export function v_72f575() {
  const [v_62676b, v_17be17] = v_5ab095<Stats | null>(null);
  const [v_c7491b, v_f1c9aa] = v_5ab095<string>("");

  v_c4deb2(() => {
    v_f1c9aa(v_b5b25a());
    v_05a921.getStats().then(v_17be17).catch(console.error);
  }, []);

  const v_adac31 = (v_f71b56) => {
    v_5a7e16(v_f71b56);
    v_f1c9aa(v_f71b56);
    v_17be17(null);
    v_05a921.getStats().then(v_17be17).catch(console.error);
  };

  const v_4552ca = v_62676b
    ? [
        { label: "Users", value: v_62676b.users, color: "#3b82f6" },
        { label: "Clones", value: v_62676b.clones, color: "#8b5cf6" },
        { label: "Messages", value: v_62676b.messages, color: "#f59e0b" },
        { label: "Total Credits", value: v_62676b.totalCredits, color: "#10b981" },
      ]
    : [];

  const v_f2a5e3 = v_c7491b === v_099696;
  const v_a2fff3 = v_c7491b === v_cf2122;

  return (
    <div>
      <div style={v_d81136.toolbar}>
        <div style={v_d81136.envLabel}>
          <span style={v_d81136.envLabelText}>현재 API</span>
          <code style={v_d81136.envValue}>{v_c7491b || "(미설정)"}</code>
        </div>
        <div style={v_d81136.btnRow}>
          <button
            type="button"
            onClick={() => v_adac31(v_099696)}
            style={{ ...v_d81136.btn, ...(v_f2a5e3 ? v_d81136.btnActive : {}) }}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => v_adac31(v_cf2122)}
            style={{ ...v_d81136.btn, ...(v_a2fff3 ? v_d81136.btnActive : {}) }}
          >
            Production
          </button>
        </div>
      </div>

      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div style={v_d81136.grid}>
        {v_4552ca.map((v_5eae50) => (
          <div key={v_5eae50.label} style={{ ...v_d81136.card, borderLeft: `4px solid ${v_5eae50.color}` }}>
            <div>
              <div style={v_d81136.cardValue}>{v_5eae50.value}</div>
              <div style={v_d81136.cardLabel}>{v_5eae50.label}</div>
            </div>
          </div>
        ))}
      </div>
      {!v_62676b && <p style={{ color: "#94a3b8" }}>Loading stats...</p>}
    </div>
  );
}

const v_d81136 = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 16px",
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  envLabel: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  envLabelText: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  envValue: {
    fontFamily: "monospace",
    fontSize: 12,
    backgroundColor: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: 4,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 360,
  },
  btnRow: { display: "flex", gap: 8 },
  btn: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    backgroundColor: "#fff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnActive: {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderColor: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardValue: { fontSize: 28, fontWeight: 700 },
  cardLabel: { fontSize: 13, color: "#64748b" },
};
