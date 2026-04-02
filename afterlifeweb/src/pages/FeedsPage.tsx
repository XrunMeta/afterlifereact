import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID", render: (v: string) => v?.slice(0, 8) + "..." },
  { key: "author", label: "Author" },
  { key: "title", label: "Title" },
  { key: "main_category", label: "Category" },
  { key: "likes_count", label: "Likes" },
  { key: "comments_count", label: "Comments" },
  { key: "created_at", label: "Created", render: (v: string) => v?.slice(0, 10) },
];

export function FeedsPage() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getFeeds().then(setFeeds).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feed?")) return;
    await api.deleteFeed(id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Feeds</h1>
      <DataTable columns={columns} data={feeds} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
