import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "credits", label: "Credits" },
  { key: "funnelStage", label: "Funnel" },
  {
    key: "marketingConsent",
    label: "Marketing",
    render: (v_81e2ef) => (v_81e2ef ? "✓" : "—"),
  },
  {
    key: "interests",
    label: "Interests",
    render: (v_81e2ef) =>
      v_81e2ef ? <span style={{ fontSize: 12, color: "#475569" }}>{v_81e2ef}</span> : "—",
  },
  {
    key: "xrunWallet",
    label: "xrun Wallet",
    render: (v_81e2ef) =>
      v_81e2ef ? (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v_81e2ef}</span>
      ) : (
        "—"
      ),
  },
  {
    key: "xrunMemberId",
    label: "xrun ID",
    render: (v_81e2ef) => (v_81e2ef ? String(v_81e2ef) : "—"),
  },
  { key: "createdAt", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) ?? "" },
];

export function v_1d1159() {
  const [v_de7ba7, v_28d82a] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921.getUsers().then(v_28d82a).catch(console.error).finally(() => v_34a50a(false));
  };

  v_c4deb2(v_f6f5de, []);

  const v_57fac2 = async (v_389afb) => {
    if (!confirm("Delete this user?")) return;
    await v_05a921.deleteUser(v_389afb);
    v_f6f5de();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>
      <DataTable columns={v_b9fa58} data={v_de7ba7} onDelete={v_57fac2} loading={v_683210} />
    </div>
  );
}
