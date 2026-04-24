import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID" },
  { key: "sessionId", label: "Session" },
  { key: "cloneId", label: "Clone" },
  { key: "role", label: "Role" },
  {
    key: "content",
    label: "Content",
    render: (v?: string) => (v && v.length > 50 ? v.slice(0, 50) + "…" : v ?? ""),
  },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Time", render: (v?: string) => v?.slice(0, 19) ?? "" },
];

export function MessagesPage() {
  const [cloneId, setCloneId] = useState("2001");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getMessages(cloneId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cloneId]);

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Messages</h1>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "#64748b" }}>Clone ID</label>
        <input
          value={cloneId}
          onChange={(e) => setCloneId(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            width: 120,
          }}
        />
      </div>
      <DataTable columns={columns} data={messages} loading={loading} />
    </div>
  );
}
