import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_80cb8d } from "pgmzxjkoagjpdcvd";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_ff2fa5 = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "탈퇴(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
  archived_cold: { label: "보관됨", color: "#1d4ed8", bg: "#dbeafe" },
};
const v_9f536f = (v_81e2ef) => {
  const v_34d5e3 = v_ff2fa5[v_81e2ef ?? "active"] ?? { label: v_81e2ef ?? "—", color: "#52525b", bg: "#f4f4f5" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: v_34d5e3.color,
        backgroundColor: v_34d5e3.bg,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {v_34d5e3.label}
    </span>
  );
};

const v_52701d = {
  background: "#D4A017",
  color: "#fff",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 12,
  fontWeight: 700,
};

const v_c9798c = (v_81e2ef) => {
  if (v_81e2ef === "expert") {
    return <span style={v_52701d}>전문가</span>;
  }
  return v_81e2ef;
};

const v_b9fa58 = [
  { key: "id", label: "ID" },
  { key: "deletionState", label: "상태", render: v_9f536f },
  { key: "name", label: "Name" },
  { key: "username", label: "클론 ID" },
  { key: "cloneType", label: "Type", render: v_c9798c },
  { key: "visibility", label: "Visibility" },
  { key: "trainingStatus", label: "Status" },
  { key: "ownerName", label: "Owner" },
  { key: "createdAt", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) ?? "" },
  {
    key: "detail",
    label: "Detail",
    render: (v_e79916, v_3ac7e7) => (
      <Link
        to={`/oth-path${v_3ac7e7.id}`}
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
