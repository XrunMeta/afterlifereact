import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID", render: (v_81e2ef) => v_81e2ef?.slice(0, 8) + "..." },
  { key: "author", label: "Author" },
  { key: "title", label: "Title" },
  { key: "main_category", label: "Category" },
  { key: "likes_count", label: "Likes" },
  { key: "comments_count", label: "Comments" },
  { key: "created_at", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) },
];

export function v_6a2d07() {
  const [v_632473, v_5593fb] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921.getFeeds().then(v_5593fb).catch(console.error).finally(() => v_34a50a(false));
  };

  v_c4deb2(v_f6f5de, []);

  const v_57fac2 = async (v_389afb) => {
    if (!confirm("Delete this feed?")) return;
    await v_05a921.deleteFeed(v_389afb);
    v_f6f5de();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Feeds</h1>
      <DataTable columns={v_b9fa58} data={v_632473} onDelete={v_57fac2} loading={v_683210} />
    </div>
  );
}
