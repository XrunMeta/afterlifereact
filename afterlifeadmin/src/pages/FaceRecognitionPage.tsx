

import { v_c4deb2, v_5ab095, v_de06a3, type v_bb76a8 } from "bapkr";
import { v_05a921 } from "../api/client";

interface Person {
  personId: number;
  userId: number;
  cloneId: number | null;
  displayName: string | null;
  consentState: string;
  createdAt: number;
  userName: string | null;
  userEmail: string;
  cloneName: string | null;
  cloneUsername: string | null;
  cloneFaceCount: number;
  legacyFaceCount: number;
  lastEnrollAt: number | null;
  srcEnroll: number;
  srcCall: number;
  srcSelf: number;
}

interface FaceRow {
  id: number;
  tbl: "clone_person_faces" | "face_embeddings";
  cloneId: number | null;
  vectorizeId: string | null;
  model: string | null;
  dim: number | null;
  source: string;
  createdAt: number;
}

const v_9f7632 = (v_3a5fef): string => {
  if (!v_3a5fef) return "—";
  const v_d799e2 = v_3a5fef < 1e12 ? v_3a5fef * 1000 : v_3a5fef;
  const v_d5dda0 = new Date(v_d799e2);
  if (Number.isNaN(v_d5dda0.getTime())) return String(v_3a5fef);
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}`;
};

export function v_7f766f() {
  const [v_fded81, v_1b22c3] = v_5ab095<Person[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_860b21, v_c50618] = v_5ab095("");
  const [v_c3457c, v_3c3608] = v_5ab095("");
  const [v_80bbda, v_e5e7e5] = v_5ab095<Person | null>(null);
  const [v_0e9c89, v_c380d3] = v_5ab095<FaceRow[]>([]);
  const [v_9b8188, v_8ac435] = v_5ab095(false);

  const v_f6f5de = v_de06a3(() => {
    v_34a50a(true);
    v_05a921
      .getFaceRecognitionPersons({
        userId: v_860b21 ? Number(v_860b21) : undefined,
        cloneId: v_c3457c ? Number(v_c3457c) : undefined,
        limit: 200,
      })
      .then((v_cb35cb) => v_1b22c3(v_cb35cb.items))
      .catch((v_49263d) => {
        console.error("getFaceRecognitionPersons failed:", v_49263d);
        v_1b22c3([]);
      })
      .finally(() => v_34a50a(false));
  }, [v_860b21, v_c3457c]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_5b0e11 = (v_e2a85c) => {
    v_e5e7e5(v_e2a85c);
    v_c380d3([]);
    v_8ac435(true);
    v_05a921
      .getFaceRecognitionPersonFaces(v_e2a85c.personId)
      .then((v_cb35cb) => v_c380d3(v_cb35cb.items))
      .catch((v_49263d) => console.error("getFaceRecognitionPersonFaces failed:", v_49263d))
      .finally(() => v_8ac435(false));
  };

  return (
    <div>
      <header style={v_d81136.header}>
        <div>
          <h1 style={v_d81136.title}>Face Recognition</h1>
          <p style={v_d81136.sub}>사람별 얼굴 인식 데이터 · 임베딩 누적 상태 (T-532 검증용)</p>
        </div>
        <div style={v_d81136.toolbar}>
          <input
            type="text"
            placeholder="userId 필터"
            value={v_860b21}
            onChange={(v_9e86fd) => v_c50618(v_9e86fd.target.value.replace(/[^\d]/g, ""))}
            style={v_d81136.input}
          />
          <input
            type="text"
            placeholder="cloneId 필터"
            value={v_c3457c}
            onChange={(v_9e86fd) => v_3c3608(v_9e86fd.target.value.replace(/[^\d]/g, ""))}
            style={v_d81136.input}
          />
          <button onClick={v_f6f5de} style={v_d81136.refreshBtn}>새로고침</button>
        </div>
      </header>

      {v_683210 ? (
        <p>로딩 중...</p>
      ) : v_fded81.length === 0 ? (
        <div style={v_d81136.empty}>등록된 얼굴 데이터가 없습니다.</div>
      ) : (
        <div style={v_d81136.tableWrap}>
          <table style={v_d81136.table}>
            <thead>
              <tr style={v_d81136.theadRow}>
                <th style={v_d81136.th}>Person</th>
                <th style={v_d81136.th}>유저</th>
                <th style={v_d81136.th}>클론</th>
                <th style={v_d81136.th}>동의</th>
                <th style={v_d81136.th} title="clone_person_faces 개수 (T-257 이후)">
                  Clone Faces
                </th>
                <th style={v_d81136.th} title="face_embeddings 개수 (legacy)">
                  Legacy
                </th>
                <th style={v_d81136.th}>Src 분포</th>
                <th style={v_d81136.th}>등록</th>
                <th style={v_d81136.th}>최근 수집</th>
                <th style={v_d81136.th}>—</th>
              </tr>
            </thead>
            <tbody>
              {v_fded81.map((v_e2a85c) => (
                <tr key={v_e2a85c.personId} style={v_d81136.tr}>
                  <td style={v_d81136.td}>
                    <div style={v_d81136.cellMain}>{v_e2a85c.displayName ?? "(이름 없음)"}</div>
                    <div style={v_d81136.cellSub}>id: {v_e2a85c.personId}</div>
                  </td>
                  <td style={v_d81136.td}>
                    <div style={v_d81136.cellMain}>{v_e2a85c.userName ?? "—"}</div>
                    <div style={v_d81136.cellSub}>{v_e2a85c.userEmail}</div>
                    <div style={v_d81136.cellSub}>id: {v_e2a85c.userId}</div>
                  </td>
                  <td style={v_d81136.td}>
                    <div style={v_d81136.cellMain}>{v_e2a85c.cloneName ?? "—"}</div>
                    {v_e2a85c.cloneUsername && <div style={v_d81136.cellSub}>@{v_e2a85c.cloneUsername}</div>}
                    {v_e2a85c.cloneId && <div style={v_d81136.cellSub}>id: {v_e2a85c.cloneId}</div>}
                  </td>
                  <td style={v_d81136.td}>
                    <span
                      style={{
                        ...v_d81136.badge,
                        color: v_e2a85c.consentState === "granted" ? "#15803d" : "#64748b",
                        backgroundColor: v_e2a85c.consentState === "granted" ? "#dcfce7" : "#f1f5f9",
                      }}
                    >
                      {v_e2a85c.consentState}
                    </span>
                  </td>
                  <td style={{ ...v_d81136.td, textAlign: "center", fontWeight: 700 }}>
                    {v_e2a85c.cloneFaceCount}
                  </td>
                  <td style={{ ...v_d81136.td, textAlign: "center", color: "#94a3b8" }}>
                    {v_e2a85c.legacyFaceCount}
                  </td>
                  <td style={v_d81136.td}>
                    <div style={v_d81136.srcRow}>
                      <span style={v_d81136.srcTag}>enroll {v_e2a85c.srcEnroll}</span>
                      <span style={v_d81136.srcTag}>call {v_e2a85c.srcCall}</span>
                      <span style={v_d81136.srcTag}>self {v_e2a85c.srcSelf}</span>
                    </div>
                  </td>
                  <td style={v_d81136.td}>{v_9f7632(v_e2a85c.createdAt)}</td>
                  <td style={v_d81136.td}>{v_9f7632(v_e2a85c.lastEnrollAt)}</td>
                  <td style={v_d81136.td}>
                    <button onClick={() => v_5b0e11(v_e2a85c)} style={v_d81136.detailBtn}>
                      벡터 목록
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {v_80bbda && (
        <div style={v_d81136.overlay} onClick={() => v_e5e7e5(null)}>
          <div style={v_d81136.modal} onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <div style={v_d81136.modalHeader}>
              <h2 style={v_d81136.modalTitle}>
                {v_80bbda.displayName ?? "(이름 없음)"} · Face Vectors
              </h2>
              <button onClick={() => v_e5e7e5(null)} style={v_d81136.closeBtn}>
                ✕
              </button>
            </div>
            <div style={v_d81136.modalBody}>
              <div style={v_d81136.summaryRow}>
                <div>Person id: {v_80bbda.personId}</div>
                <div>총 {v_0e9c89.length}개 벡터 (Vectorize)</div>
              </div>
              {v_9b8188 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>로딩 중...</div>
              ) : v_0e9c89.length === 0 ? (
                <div style={v_d81136.sectionEmpty}>벡터가 없습니다.</div>
              ) : (
                <table style={{ ...v_d81136.table, marginTop: 12 }}>
                  <thead>
                    <tr style={v_d81136.theadRow}>
                      <th style={v_d81136.th}>#</th>
                      <th style={v_d81136.th}>Table</th>
                      <th style={v_d81136.th}>Vectorize ID</th>
                      <th style={v_d81136.th}>Source</th>
                      <th style={v_d81136.th}>Model · Dim</th>
                      <th style={v_d81136.th}>수집 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v_0e9c89.map((v_8b5cd8) => (
                      <tr key={`${v_8b5cd8.tbl}-${v_8b5cd8.id}`} style={v_d81136.tr}>
                        <td style={v_d81136.td}>{v_8b5cd8.id}</td>
                        <td style={v_d81136.td}>
                          <span
                            style={{
                              ...v_d81136.badge,
                              color: v_8b5cd8.tbl === "clone_person_faces" ? "#1d4ed8" : "#94a3b8",
                              backgroundColor: v_8b5cd8.tbl === "clone_person_faces" ? "#dbeafe" : "#f1f5f9",
                            }}
                          >
                            {v_8b5cd8.tbl === "clone_person_faces" ? "clone-scope" : "legacy"}
                          </span>
                        </td>
                        <td style={{ ...v_d81136.td, fontFamily: "monospace", fontSize: 11 }}>
                          {v_8b5cd8.vectorizeId ?? "—"}
                        </td>
                        <td style={v_d81136.td}>{v_8b5cd8.source}</td>
                        <td style={v_d81136.td}>
                          {v_8b5cd8.model ?? "—"} · {v_8b5cd8.dim ?? "—"}d
                        </td>
                        <td style={v_d81136.td}>{v_9f7632(v_8b5cd8.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, v_bb76a8> = {
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 24, color: "#0f172a" },
  sub: { margin: "4px 0 0", color: "#64748b", fontSize: 13 },
  toolbar: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 13,
    backgroundColor: "#fff",
    width: 110,
  },
  refreshBtn: {
    padding: "8px 14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
  },
  tableWrap: {
    backgroundColor: "#fff",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  theadRow: { backgroundColor: "#f8fafc" },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 12,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #e2e8f0",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px", fontSize: 13, color: "#0f172a", verticalAlign: "top" },
  cellMain: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  cellSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },
  srcRow: { display: "flex", flexDirection: "column", gap: 2 },
  srcTag: {
    fontSize: 11,
    color: "#475569",
    fontFamily: "monospace",
  },
  detailBtn: {
    padding: "6px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 12,
    color: "#0f172a",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 900,
    maxHeight: "88vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: { margin: 0, fontSize: 17, color: "#0f172a" },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#64748b",
  },
  modalBody: { padding: "16px 20px", overflowY: "auto" },
  summaryRow: {
    display: "flex",
    gap: 24,
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  sectionEmpty: { fontSize: 12, color: "#94a3b8", padding: 20, textAlign: "center" },
};
