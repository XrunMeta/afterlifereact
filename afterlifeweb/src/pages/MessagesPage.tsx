import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID" },
  { key: "sessionId", label: "Session" },
  { key: "cloneId", label: "Clone" },
  { key: "role", label: "Role" },
  {
    key: "content",
    label: "Content",
    render: (v_81e2ef) => (v_81e2ef && v_81e2ef.length > 50 ? v_81e2ef.slice(0, 50) + "…" : v_81e2ef ?? ""),
  },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Time", render: (v_81e2ef) => v_81e2ef?.slice(0, 19) ?? "" },
];

export function v_110d5c() {
  const [v_6e0fd3, v_5aba76] = v_5ab095("2001");
  const [v_fa56e0, v_41d55d] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  v_c4deb2(() => {
    v_34a50a(true);
    v_05a921
      .getMessages(v_6e0fd3)
      .then(v_41d55d)
      .catch(console.error)
      .finally(() => v_34a50a(false));
  }, [v_6e0fd3]);

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Messages</h1>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "#64748b" }}>Clone ID</label>
        <input
          value={v_6e0fd3}
          onChange={(v_9e86fd) => v_5aba76(v_9e86fd.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            width: 120,
          }}
        />
      </div>
      <DataTable columns={v_b9fa58} data={v_fa56e0} loading={v_683210} />
    </div>
  );
}
