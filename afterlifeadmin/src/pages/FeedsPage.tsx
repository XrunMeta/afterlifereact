import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_05a921 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";

const v_b9fa58 = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
];

export function v_6a2d07() {
  const [v_632473, v_5593fb] = v_5ab095<any[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);

  v_c4deb2(() => {
    v_34a50a(true);
    v_05a921.getFeeds().then(v_5593fb).catch(console.error).finally(() => v_34a50a(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Feeds</h1>
      <p style={{ color: "#94a3b8", marginBottom: 16 }}>
        Feeds 라우트는 폐기됐어 (M-6 단계). 미리보기 전용 빈 응답으로 대체된 페이지.
      </p>
      <DataTable columns={v_b9fa58} data={v_632473} loading={v_683210} />
    </div>
  );
}
