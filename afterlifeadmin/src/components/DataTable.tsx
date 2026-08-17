import type { v_4a8ba2, v_bb76a8 } from 'bapkr'

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => v_4a8ba2;

  testid?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onDelete?: (id: string) => void;
  loading?: boolean;

  rowTestId?: (row: any) => string;
}

export function v_c1eeb6({ columns: v_b9fa58, data: v_9390e8, onDelete: v_9bb421, loading: v_683210, rowTestId: v_3b9e09 }: DataTableProps) {
  if (v_683210) {
    return <div style={v_d81136.loading}>Loading...</div>;
  }

  return (
    <div style={v_d81136.wrapper}>
      <table style={v_d81136.table}>
        <thead>
          <tr>
            {v_b9fa58.map((v_c8b83f) => (
              <th key={v_c8b83f.key} style={v_d81136.th}>
                {v_c8b83f.label}
              </th>
            ))}
            {v_9bb421 && <th style={v_d81136.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {v_9390e8.length === 0 ? (
            <tr>
              <td
                colSpan={v_b9fa58.length + (v_9bb421 ? 1 : 0)}
                style={{ ...v_d81136.td, textAlign: "center", color: "#94a3b8" }}
              >
                No data
              </td>
            </tr>
          ) : (
            v_9390e8.map((v_3ac7e7) => (
              <tr key={v_3ac7e7.id} style={v_d81136.tr} data-testid={v_3b9e09?.(v_3ac7e7)}>
                {v_b9fa58.map((v_c8b83f) => (
                  <td key={v_c8b83f.key} style={v_d81136.td} data-testid={v_c8b83f.testid}>
                    {v_c8b83f.render ? v_c8b83f.render(v_3ac7e7[v_c8b83f.key], v_3ac7e7) : v_3ac7e7[v_c8b83f.key]}
                  </td>
                ))}
                {v_9bb421 && (
                  <td style={v_d81136.td}>
                    <button
                      onClick={() => v_9bb421(v_3ac7e7.id)}
                      style={v_d81136.deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, v_bb76a8> = {
  wrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  tr: {
    transition: "background-color 0.1s",
  },
  loading: {
    textAlign: "center",
    padding: 40,
    color: "#94a3b8",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 12,
  },
};
