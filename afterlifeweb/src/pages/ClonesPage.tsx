import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID", render: (v: string) => v?.slice(0, 8) + "..." },
  { key: "name", label: "Name" },
  { key: "username", label: "Username" },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "visibility", label: "Visibility" },
  {
    key: "learning_progress",
    label: "Progress",
    render: (v: number) => `${v}%`,
  },
  { key: "created_at", label: "Created", render: (v: string) => v?.slice(0, 10) },
];

export function ClonesPage() {
  const [clones, setClones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getClones().then(setClones).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this clone?")) return;
    await api.deleteClone(id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Clones</h1>
      <DataTable columns={columns} data={clones} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
