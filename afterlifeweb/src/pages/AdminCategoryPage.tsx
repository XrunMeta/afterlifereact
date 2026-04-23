import { v_80cb8d } from "pgmzxjkoagjpdcvd";
import { v_b4a7e7, type v_ebbded } from "../data/apiCatalog";

interface Props {
  title: string;
  description: string;
  categories: string[];
}

const v_7f5027 = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

export function v_9ddede({ title: v_9f1622, description: v_6856a9, categories: v_8bc599 }: Props) {
  const v_4622b9 = v_b4a7e7.filter((v_9e86fd) => v_8bc599.includes(v_9e86fd.category));
  const grouped: Record<string, v_ebbded[]> = {};
  for (const v_9bf432 of v_8bc599) {
    v_4d79ca[v_9bf432] = v_4622b9.filter((v_9e86fd) => v_9e86fd.category === v_9bf432);
  }
  return (
    <div>
      <h1 style={{ marginBottom: 6 }}>{v_9f1622}</h1>
      <p style={v_d81136.desc}>{v_6856a9}</p>
      <div style={v_d81136.cta}>
        <Link to="/testbed" style={v_d81136.testbedBtn}>
          → API Testbed 에서 실행
        </Link>
      </div>

      {v_8bc599.map((v_9bf432) => {
        const v_ef8ab1 = v_4d79ca[v_9bf432];
        if (!v_ef8ab1 || v_ef8ab1.length === 0) return null;
        return (
          <section key={v_9bf432} style={v_d81136.section}>
            <h2 style={v_d81136.sectionTitle}>
              {v_9bf432}{" "}
              <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 400 }}>
                ({v_ef8ab1.length})
              </span>
            </h2>
            <table style={v_d81136.table}>
              <thead>
                <tr>
                  <th style={v_d81136.th}>Method</th>
                  <th style={v_d81136.th}>Path</th>
                  <th style={v_d81136.th}>Auth</th>
                  <th style={v_d81136.th}>Source</th>
                </tr>
              </thead>
              <tbody>
                {v_ef8ab1.map((v_9e86fd) => (
                  <tr key={v_9e86fd.id}>
                    <td style={v_d81136.td}>
                      <span
                        style={{
                          ...v_d81136.methodBadge,
                          backgroundColor:
                            v_7f5027[v_9e86fd.method] ?? "#64748b",
                        }}
                      >
                        {v_9e86fd.method}
                      </span>
                    </td>
                    <td style={{ ...v_d81136.td, fontFamily: "monospace" }}>
                      {v_9e86fd.path}
                    </td>
                    <td style={v_d81136.td}>{v_9e86fd.auth}</td>
                    <td style={{ ...v_d81136.td, color: "#64748b", fontSize: 12 }}>
                      {v_9e86fd.file}:{v_9e86fd.line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

const v_d81136 = {
  desc: { color: "#64748b", fontSize: 14, marginBottom: 16 },
  cta: { marginBottom: 16 },
  testbedBtn: {
    display: "inline-block",
    padding: "8px 14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    border: "1px solid #e2e8f0",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, marginTop: 0, marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
  },
  td: { padding: "8px 12px", borderBottom: "1px solid #f1f5f9" },
  methodBadge: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 4,
    display: "inline-block",
  },
};
