import { Link } from "react-router-dom";
import { API_CATALOG, type ApiEndpoint } from "../data/apiCatalog";

interface Props {
  title: string;
  description: string;
  categories: string[];
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

export function AdminCategoryPage({ title, description, categories }: Props) {
  const items = API_CATALOG.filter((e) => categories.includes(e.category));
  const grouped: Record<string, ApiEndpoint[]> = {};
  for (const cat of categories) {
    grouped[cat] = items.filter((e) => e.category === cat);
  }
  return (
    <div>
      <h1 style={{ marginBottom: 6 }}>{title}</h1>
      <p style={styles.desc}>{description}</p>
      <div style={styles.cta}>
        <Link to="/testbed" style={styles.testbedBtn}>
          → API Testbed 에서 실행
        </Link>
      </div>

      {categories.map((cat) => {
        const list = grouped[cat];
        if (!list || list.length === 0) return null;
        return (
          <section key={cat} style={styles.section}>
            <h2 style={styles.sectionTitle}>
              {cat}{" "}
              <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 400 }}>
                ({list.length})
              </span>
            </h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Path</th>
                  <th style={styles.th}>Auth</th>
                  <th style={styles.th}>Source</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.methodBadge,
                          backgroundColor:
                            METHOD_COLORS[e.method] ?? "#64748b",
                        }}
                      >
                        {e.method}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: "monospace" }}>
                      {e.path}
                    </td>
                    <td style={styles.td}>{e.auth}</td>
                    <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                      {e.file}:{e.line}
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

const styles: Record<string, React.CSSProperties> = {
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
