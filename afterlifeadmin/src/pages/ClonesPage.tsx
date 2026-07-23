import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const DELETION_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "탈퇴(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
  archived_cold: { label: "보관됨", color: "#1d4ed8", bg: "#dbeafe" },
};
const renderDeletionState = (v?: string) => {
  const info = DELETION_BADGE[v ?? "active"] ?? { label: v ?? "—", color: "#52525b", bg: "#f4f4f5" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: info.color,
        backgroundColor: info.bg,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {info.label}
    </span>
  );
};

const EXPERT_BADGE_STYLE: React.CSSProperties = {
  background: "#D4A017",
  color: "#fff",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 12,
  fontWeight: 700,
};

const renderCloneType = (v?: string) => {
  if (v === "expert") {
    return <span style={EXPERT_BADGE_STYLE}>전문가</span>;
  }
  return v;
};

const columns = [
  { key: "id", label: "ID" },
  { key: "deletionState", label: "상태", render: renderDeletionState },
  { key: "name", label: "Name" },
  { key: "username", label: "클론 ID" },
  { key: "cloneType", label: "Type", render: renderCloneType },
  { key: "visibility", label: "Visibility" },
  { key: "trainingStatus", label: "Status" },
  { key: "ownerName", label: "Owner" },
  { key: "createdAt", label: "Created", render: (v?: string) => v?.slice(0, 10) ?? "" },
  {
    key: "detail",
    label: "Detail",
    render: (_v: unknown, row: { id: number }) => (
      <Link
        to={`/oth-path${row.id}`}
        style={{
          fontSize: 12,
          padding: "4px 10px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          borderRadius: 4,
          textDecoration: "none",
        }}
      >
        보기
      </Link>
    ),
  },
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
