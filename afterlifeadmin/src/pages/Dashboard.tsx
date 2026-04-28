import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Stats {
  users: number;
  clones: number;
  messages: number;
  totalCredits: number;
}

const PREVIEW_API = "https://edge-alt-preview.example.invalid";
const PROD_API = "https://edge-alt.example.invalid";
const STORAGE_KEY = "afterlife.admin.apiOverride";

function readActiveApi(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_API_URL ?? PROD_API);
  } catch {
    return PROD_API;
  }
}

function applyApi(url: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, url);
  } catch {

  }

}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeApi, setActiveApi] = useState<string>("");

  useEffect(() => {
    setActiveApi(readActiveApi());
    api.getStats().then(setStats).catch(console.error);
  }, []);

  const handleSwitch = (url: string) => {
    applyApi(url);
    setActiveApi(url);
    setStats(null);
    api.getStats().then(setStats).catch(console.error);
  };

  const cards = stats
    ? [
        { label: "Users", value: stats.users, color: "#3b82f6" },
        { label: "Clones", value: stats.clones, color: "#8b5cf6" },
        { label: "Messages", value: stats.messages, color: "#f59e0b" },
        { label: "Total Credits", value: stats.totalCredits, color: "#10b981" },
      ]
    : [];

  const isPreview = activeApi === PREVIEW_API;
  const isProd = activeApi === PROD_API;

  return (
    <div>
      <div style={styles.toolbar}>
        <div style={styles.envLabel}>
          <span style={styles.envLabelText}>현재 API</span>
          <code style={styles.envValue}>{activeApi || "(미설정)"}</code>
        </div>
        <div style={styles.btnRow}>
          <button
            type="button"
            onClick={() => handleSwitch(PREVIEW_API)}
            style={{ ...styles.btn, ...(isPreview ? styles.btnActive : {}) }}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => handleSwitch(PROD_API)}
            style={{ ...styles.btn, ...(isProd ? styles.btnActive : {}) }}
          >
            Production
          </button>
        </div>
      </div>

      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={{ ...styles.card, borderLeft: `4px solid ${card.color}` }}>
            <div>
              <div style={styles.cardValue}>{card.value}</div>
              <div style={styles.cardLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>
      {!stats && <p style={{ color: "#94a3b8" }}>Loading stats...</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
