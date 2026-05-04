import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const DELETION_STATE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "탈퇴(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
};

const renderDeletionState = (v?: string) => {
  const s = DELETION_STATE_LABEL[v ?? "active"] ?? DELETION_STATE_LABEL.active;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
      }}
    >
      {s.label}
    </span>
  );
};

const columns = [
  { key: "id", label: "ID" },
  {
    key: "deletionState",
    label: "상태",
    render: renderDeletionState,
  },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "credits", label: "Credits" },
  { key: "funnelStage", label: "Funnel" },
  {
    key: "marketingConsent",
    label: "Marketing",
    render: (v?: number) => (v ? "✓" : "—"),
  },
  {
    key: "interests",
    label: "Interests",
    render: (v?: string | null) =>
      v ? <span style={{ fontSize: 12, color: "#475569" }}>{v}</span> : "—",
  },
  {
    key: "xrunWallet",
    label: "xrun Wallet",
    render: (v?: string | null) =>
      v ? (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>
      ) : (
        "—"
      ),
  },
  {
    key: "xrunMemberId",
    label: "xrun ID",
    render: (v?: number | null) => (v ? String(v) : "—"),
  },
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
