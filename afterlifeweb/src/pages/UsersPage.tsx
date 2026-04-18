import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "credits", label: "Credits" },
  { key: "funnelStage", label: "Funnel" },
  { key: "createdAt", label: "Created", render: (v?: string) => v?.slice(0, 10) ?? "" },
];

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await api.deleteUser(id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>
      <DataTable columns={columns} data={users} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
