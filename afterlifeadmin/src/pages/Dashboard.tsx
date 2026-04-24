import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Stats {
  users: number;
  clones: number;
  messages: number;
  totalCredits: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Users", value: stats.users, color: "#3b82f6" },
        { label: "Clones", value: stats.clones, color: "#8b5cf6" },
        { label: "Messages", value: stats.messages, color: "#f59e0b" },
        { label: "Total Credits", value: stats.totalCredits, color: "#10b981" },
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
