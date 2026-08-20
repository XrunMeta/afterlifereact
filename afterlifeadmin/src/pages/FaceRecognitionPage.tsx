

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { api } from "../api/client";

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

const fmtDate = (ts: number | null): string => {
  if (!ts) return "—";
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function FaceRecognitionPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [cloneIdFilter, setCloneIdFilter] = useState("");
  const [detailOpen, setDetailOpen] = useState<Person | null>(null);
  const [detailFaces, setDetailFaces] = useState<FaceRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getFaceRecognitionPersons({
        userId: userIdFilter ? Number(userIdFilter) : undefined,
        cloneId: cloneIdFilter ? Number(cloneIdFilter) : undefined,
        limit: 200,
      })
      .then((r) => setPersons(r.items))
      .catch((err) => {
        console.error("getFaceRecognitionPersons failed:", err);
        setPersons([]);
      })
      .finally(() => setLoading(false));
  }, [userIdFilter, cloneIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (p: Person) => {
    setDetailOpen(p);
    setDetailFaces([]);
    setDetailLoading(true);
    api
      .getFaceRecognitionPersonFaces(p.personId)
      .then((r) => setDetailFaces(r.items))
      .catch((err) => console.error("getFaceRecognitionPersonFaces failed:", err))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Face Recognition</h1>
          <p style={styles.sub}>사람별 얼굴 인식 데이터 · 임베딩 누적 상태 (T-532 검증용)</p>
        </div>
        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="userId 필터"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value.replace(/[^\d]/g, ""))}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="cloneId 필터"
            value={cloneIdFilter}
            onChange={(e) => setCloneIdFilter(e.target.value.replace(/[^\d]/g, ""))}
            style={styles.input}
          />
          <button onClick={load} style={styles.refreshBtn}>새로고침</button>
        </div>
      </header>

      {loading ? (
        <p>로딩 중...</p>
      ) : persons.length === 0 ? (
        <div style={styles.empty}>등록된 얼굴 데이터가 없습니다.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Person</th>
                <th style={styles.th}>유저</th>
                <th style={styles.th}>클론</th>
                <th style={styles.th}>동의</th>
                <th style={styles.th} title="clone_person_faces 개수 (T-257 이후)">
                  Clone Faces
                </th>
                <th style={styles.th} title="face_embeddings 개수 (legacy)">
                  Legacy
                </th>
                <th style={styles.th}>Src 분포</th>
                <th style={styles.th}>등록</th>
                <th style={styles.th}>최근 수집</th>
                <th style={styles.th}>—</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((p) => (
                <tr key={p.personId} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.cellMain}>{p.displayName ?? "(이름 없음)"}</div>
                    <div style={styles.cellSub}>id: {p.personId}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.cellMain}>{p.userName ?? "—"}</div>
                    <div style={styles.cellSub}>{p.userEmail}</div>
                    <div style={styles.cellSub}>id: {p.userId}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.cellMain}>{p.cloneName ?? "—"}</div>
                    {p.cloneUsername && <div style={styles.cellSub}>@{p.cloneUsername}</div>}
                    {p.cloneId && <div style={styles.cellSub}>id: {p.cloneId}</div>}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        color: p.consentState === "granted" ? "#15803d" : "#64748b",
                        backgroundColor: p.consentState === "granted" ? "#dcfce7" : "#f1f5f9",
                      }}
                    >
                      {p.consentState}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>
                    {p.cloneFaceCount}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                    {p.legacyFaceCount}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.srcRow}>
                      <span style={styles.srcTag}>enroll {p.srcEnroll}</span>
                      <span style={styles.srcTag}>call {p.srcCall}</span>
                      <span style={styles.srcTag}>self {p.srcSelf}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{fmtDate(p.createdAt)}</td>
                  <td style={styles.td}>{fmtDate(p.lastEnrollAt)}</td>
                  <td style={styles.td}>
                    <button onClick={() => openDetail(p)} style={styles.detailBtn}>
                      벡터 목록
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailOpen && (
        <div style={styles.overlay} onClick={() => setDetailOpen(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {detailOpen.displayName ?? "(이름 없음)"} · Face Vectors
              </h2>
              <button onClick={() => setDetailOpen(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.summaryRow}>
                <div>Person id: {detailOpen.personId}</div>
                <div>총 {detailFaces.length}개 벡터 (Vectorize)</div>
              </div>
              {detailLoading ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>로딩 중...</div>
              ) : detailFaces.length === 0 ? (
                <div style={styles.sectionEmpty}>벡터가 없습니다.</div>
              ) : (
                <table style={{ ...styles.table, marginTop: 12 }}>
                  <thead>
                    <tr style={styles.theadRow}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Table</th>
                      <th style={styles.th}>Vectorize ID</th>
                      <th style={styles.th}>Source</th>
                      <th style={styles.th}>Model · Dim</th>
                      <th style={styles.th}>수집 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailFaces.map((f) => (
                      <tr key={`${f.tbl}-${f.id}`} style={styles.tr}>
                        <td style={styles.td}>{f.id}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              color: f.tbl === "clone_person_faces" ? "#1d4ed8" : "#94a3b8",
                              backgroundColor: f.tbl === "clone_person_faces" ? "#dbeafe" : "#f1f5f9",
                            }}
                          >
                            {f.tbl === "clone_person_faces" ? "clone-scope" : "legacy"}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 11 }}>
                          {f.vectorizeId ?? "—"}
                        </td>
                        <td style={styles.td}>{f.source}</td>
                        <td style={styles.td}>
                          {f.model ?? "—"} · {f.dim ?? "—"}d
                        </td>
                        <td style={styles.td}>{fmtDate(f.createdAt)}</td>
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

const styles: Record<string, CSSProperties> = {
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
