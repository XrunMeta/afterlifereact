import { useEffect, useState } from "react";
import { api } from "../api/client";
import { DataTable } from "../components/DataTable";

const columns = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
];

export function FeedsPage() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getFeeds().then(setFeeds).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Feeds</h1>
      <p style={{ color: "#94a3b8", marginBottom: 16 }}>
        Feeds 라우트는 폐기됐어 (M-6 단계). 미리보기 전용 빈 응답으로 대체된 페이지.
      </p>
      <DataTable columns={columns} data={feeds} loading={loading} />
    </div>
  );
}
