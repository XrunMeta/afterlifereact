import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID", render: (v: string) => v?.slice(0, 8) + "..." },
  { key: "session_id", label: "Session", render: (v: string) => v?.slice(0, 8) + "..." },
  { key: "clone_id", label: "Clone", render: (v: string) => v?.slice(0, 8) + "..." },
  { key: "sender_type", label: "Sender" },
  { key: "text", label: "Text", render: (v: string) => v?.length > 50 ? v.slice(0, 50) + "..." : v },
  { key: "input_type", label: "Input" },
  { key: "created_at", label: "Time", render: (v: string) => v?.slice(0, 19) },
];

export function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMessages("all").then(setMessages).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Messages</h1>
      <DataTable columns={columns} data={messages} loading={loading} />
    </div>
  );
}
