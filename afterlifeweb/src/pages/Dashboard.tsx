import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Stats {
  totalUsers: number;
  totalClones: number;
  totalFeeds: number;
  totalMessages: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Users", value: stats.totalUsers, color: "#3b82f6" },
        { label: "Clones", value: stats.totalClones, color: "#8b5cf6" },
        { label: "Feeds", value: stats.totalFeeds, color: "#10b981" },
        { label: "Messages", value: stats.totalMessages, color: "#f59e0b" },
      ]
    : [];

  return (
    <div>
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
