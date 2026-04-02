import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";

interface Stats {
  totalUsers: number;
  totalClones: number;
  totalFeeds: number;
  totalMessages: number;
}

export function v_72f575() {
  const [v_62676b, v_17be17] = v_5ab095<Stats | null>(null);

  v_c4deb2(() => {
    v_05a921.getStats().then(v_17be17).catch(console.error);
  }, []);

  const v_4552ca = v_62676b
    ? [
        { label: "Users", value: v_62676b.totalUsers, color: "#3b82f6" },
        { label: "Clones", value: v_62676b.totalClones, color: "#8b5cf6" },
        { label: "Feeds", value: v_62676b.totalFeeds, color: "#10b981" },
        { label: "Messages", value: v_62676b.totalMessages, color: "#f59e0b" },
      ]
    : [];

  return (
    <div>
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
