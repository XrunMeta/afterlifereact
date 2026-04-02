import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID", render: (v_81e2ef) => v_81e2ef?.slice(0, 8) + "..." },
  { key: "name", label: "Name" },
  { key: "username", label: "Username" },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "visibility", label: "Visibility" },
  {
    key: "learning_progress",
    label: "Progress",
    render: (v_81e2ef) => `${v_81e2ef}%`,
  },
  { key: "created_at", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) },
];

export function v_c7f476() {
  const [v_f891e6, v_3302bc] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921.getClones().then(v_3302bc).catch(console.error).finally(() => v_34a50a(false));
  };

  v_c4deb2(v_f6f5de, []);

  const v_57fac2 = async (v_389afb) => {
    if (!confirm("Delete this clone?")) return;
    await v_05a921.deleteClone(v_389afb);
    v_f6f5de();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Clones</h1>
      <DataTable columns={v_b9fa58} data={v_f891e6} onDelete={v_57fac2} loading={v_683210} />
    </div>
  );
}
