import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID", render: (v_81e2ef) => v_81e2ef?.slice(0, 8) + "..." },
  { key: "session_id", label: "Session", render: (v_81e2ef) => v_81e2ef?.slice(0, 8) + "..." },
  { key: "clone_id", label: "Clone", render: (v_81e2ef) => v_81e2ef?.slice(0, 8) + "..." },
  { key: "sender_type", label: "Sender" },
  { key: "text", label: "Text", render: (v_81e2ef) => v_81e2ef?.length > 50 ? v_81e2ef.slice(0, 50) + "..." : v_81e2ef },
  { key: "input_type", label: "Input" },
  { key: "created_at", label: "Time", render: (v_81e2ef) => v_81e2ef?.slice(0, 19) },
];

export function v_110d5c() {
  const [v_fa56e0, v_41d55d] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  v_c4deb2(() => {
    v_34a50a(true);
    v_05a921.getMessages("all").then(v_41d55d).catch(console.error).finally(() => v_34a50a(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Messages</h1>
      <DataTable columns={v_b9fa58} data={v_fa56e0} loading={v_683210} />
    </div>
  );
}
