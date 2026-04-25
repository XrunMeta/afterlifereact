import type { ReactNode, CSSProperties } from 'react'

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function DataTable({ columns, data, onDelete, loading }: DataTableProps) {
  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>
                {col.label}
              </th>
            ))}
            {onDelete && <th style={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onDelete ? 1 : 0)}
                style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}
              >
                No data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} style={styles.tr}>
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {onDelete && (
                  <td style={styles.td}>
                    <button
                      onClick={() => onDelete(row.id)}
                      style={styles.deleteBtn}
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

const styles: Record<string, CSSProperties> = {
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
