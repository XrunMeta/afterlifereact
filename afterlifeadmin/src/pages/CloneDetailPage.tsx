import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { rawRequest, api } from "../api/client";
import { ReasonPromptModal } from "../components/ReasonPromptModal";
import { TID } from "@afterlife/test-ids";

interface CloneRow {
  id: number;
  name: string;
  username: string;
  description: string | null;
  cloneType: "memlow" | "friend" | "mentor" | "celeb";
  visibility: "public" | "followers" | "private";
  trainingStatus: string;
  ownerId: number;
  ownerName: string | null;
  l1Profile: unknown;
  l2Profile: unknown;
  createdAt: string;

  deletionState?: "active" | "soft_deleted" | "archived_cold" | "hard_deleted";
  softDeletedAt?: string | null;
  adminSuspendedAt?: string | null;
  adminSuspendReason?: string | null;
}

type DetailPendingAction = "suspend" | "delete" | "restore";

interface Share {
  id: number;
  targetUserId: number | null;
  targetUserName: string | null;
  inviteEmail: string | null;
  relation: string | null;
  role: "viewer" | "owner";
  status: "pending" | "invited" | "accepted" | "rejected";
  createdAt: string;
}

interface DetailResp {
  clone: CloneRow;
  shares: Share[];
  stats: { followers: number; messages: number };
}

interface GenealogyResp {
  clone: {
    id: number;
    name: string;
    cloneType: string;
    ownerId: number;
    ownerName: string | null;
  };
  root: {
    userId: number;
    name: string;
    relation: "self";
    role: "owner";
    status: "accepted";
  };
  members: Share[];
}

const RELATION_LABEL: Record<string, string> = {
  mother: "어머니",
  father: "아버지",
  spouse: "배우자",
  child: "자녀",
  sibling: "형제자매",
  friend: "친구",
  pet: "반려동물",
  other: "기타",
};

const STATUS_COLOR: Record<string, string> = {
  accepted: "#10b981",
  pending: "#f59e0b",
  invited: "#8b5cf6",
  rejected: "#ef4444",
};

export function CloneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResp | null>(null);
  const [gen, setGen] = useState<GenealogyResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<DetailPendingAction | null>(null);

  const reload = async () => {
    if (!id) return;
    try {
      const d = await rawRequest("GET", `/oth-path${id}/detail`);
      if (!d.ok) throw new Error(`detail ${d.status}`);
      setData(d.body as DetailResp);
      const g = await rawRequest("GET", `/oth-path${id}/genealogy`);
      if (g.ok) setGen(g.body as GenealogyResp);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useEffect(() => {
    reload();

  }, [id]);

  const runAction = async (reason: string) => {
    if (!id || !pending) return;
    if (pending === "suspend") await api.suspendClone(id, reason);
    else if (pending === "delete") await api.deleteClone(id, reason);
    else await api.restoreClone(id, reason || undefined);
    setPending(null);
    await reload();
  };

  if (err) {
    return (
      <div>
        <h1>Clone Detail</h1>
        <div style={styles.err}>{err}</div>
        <Link to="/oth-path">← Clones 목록</Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1>Clone Detail</h1>
        <p style={{ color: "#94a3b8" }}>Loading...</p>
      </div>
    );
  }

  const { clone, shares, stats } = data;
  const isMemlow = clone.cloneType === "memlow";

  return (
    <div>
      <Link to="/oth-path" style={styles.back}>
        ← Clones 목록
      </Link>
      <div style={styles.titleRow}>
        <h1 style={{ margin: 0 }}>
          <span data-testid={TID.admin.cloneDetail.name}>{clone.name}</span>{" "}
          <span style={{ color: "#64748b", fontSize: 16, fontWeight: 400 }}>
            @{clone.username}
          </span>
        </h1>
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: cloneTypeColor(clone.cloneType),
          }}
        >
          {clone.cloneType}
        </span>
        <span style={styles.visBadge}>{clone.visibility}</span>
      </div>

      {}
      <div style={styles.statusBar}>
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor:
              clone.deletionState === "soft_deleted"
                ? "#f59e0b"
                : clone.deletionState === "archived_cold"
                  ? "#2563eb"
                  : clone.deletionState === "hard_deleted"
                    ? "#b91c1c"
                    : "#16a34a",
          }}
        >
          {clone.deletionState === "soft_deleted"
            ? "삭제됨(복구가능)"
            : clone.deletionState === "archived_cold"
              ? "보관됨(cold)"
              : clone.deletionState === "hard_deleted"
                ? "영구 삭제"
                : "활성"}
        </span>
        {clone.adminSuspendedAt && (
          <span style={{ ...styles.statusBadge, backgroundColor: "#9a3412" }} title={clone.adminSuspendReason ?? undefined}>
            일시중지 · {clone.adminSuspendReason ?? "사유 없음"}
          </span>
        )}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {(clone.deletionState ?? "active") === "active" && !clone.adminSuspendedAt && (
            <button style={detailActionBtnStyle("#f59e0b")} onClick={() => setPending("suspend")}>
              비활성화
            </button>
          )}
          {(clone.deletionState ?? "active") === "active" && clone.adminSuspendedAt && (
            <button style={detailActionBtnStyle("#3b82f6")} onClick={() => setPending("restore")}>
              중지 해제
            </button>
          )}
          {(clone.deletionState ?? "active") === "active" && (
            <button style={detailActionBtnStyle("#ef4444")} onClick={() => setPending("delete")}>
              삭제
            </button>
          )}
          {clone.deletionState === "soft_deleted" && (
            <button style={detailActionBtnStyle("#3b82f6")} onClick={() => setPending("restore")}>
              복구
            </button>
          )}
          {(clone.deletionState === "archived_cold" || clone.deletionState === "hard_deleted") && (
            <Link to="/oth-path" style={{ fontSize: 12, color: "#1d4ed8", alignSelf: "center" }}>
              cold-recovery 에서 복구
            </Link>
          )}
        </div>
      </div>

      <div style={styles.metaRow}>
        <span style={styles.meta}>ID #{clone.id}</span>
        <span style={styles.meta}>
          소유자: {clone.ownerName ?? "-"} (#{clone.ownerId})
        </span>
        <span style={styles.meta}>상태: {clone.trainingStatus}</span>
        <span style={styles.meta}>
          생성일: {clone.createdAt?.slice(0, 10)}
        </span>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Followers" value={stats.followers} />
        <StatCard label="Messages" value={stats.messages} />
        <StatCard label="Coowners" value={shares.length} />
      </div>

      <Section title="설명">
        <div style={styles.desc} data-testid={TID.admin.cloneDetail.description}>
          {clone.description || <span style={{ color: "#94a3b8" }}>(없음)</span>}
        </div>
      </Section>

      {isMemlow && gen ? (
        <Section title="가계도 (Memlow Genealogy)">
          <Genealogy gen={gen} />
        </Section>
      ) : null}

      <Section title={`공동 소유자 / 공유 (${shares.length})`}>
        {shares.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>공유 내역 없음</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Target</th>
                <th style={styles.th}>Relation</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((s) => (
                <tr key={s.id}>
                  <td style={styles.td}>#{s.id}</td>
                  <td style={styles.td}>
                    {s.targetUserName ?? s.inviteEmail ?? "-"}
                    {s.targetUserId ? ` (#${s.targetUserId})` : ""}
                  </td>
                  <td style={styles.td}>
                    {s.relation
                      ? RELATION_LABEL[s.relation] ?? s.relation
                      : "-"}
                  </td>
                  <td style={styles.td}>{s.role}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor:
                          STATUS_COLOR[s.status] ?? "#64748b",
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={styles.td}>{s.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="페르소나 — L1 Profile (핵심 특성)">
        <JsonView value={clone.l1Profile} />
      </Section>
      <Section title="페르소나 — L2 Profile (맥락/기억 요약)">
        <JsonView value={clone.l2Profile} />
      </Section>

      <Section title="관련 API">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ApiChip path={`GET /oth-path${clone.id}/detail`} />
          {isMemlow && (
            <ApiChip path={`GET /oth-path${clone.id}/genealogy`} />
          )}
          <ApiChip path={`GET /oth-path${clone.id}`} />
          <ApiChip path={`GET /oth-path${clone.id}/oth-path`} />
          <ApiChip path={`GET /oth-path${clone.id}/messages`} />
          <ApiChip path={`GET /oth-path${clone.id}/shares`} />
          <ApiChip path={`GET /oth-path${clone.id}/memory/l1`} />
          <ApiChip path={`GET /oth-path${clone.id}/memory/l2`} />
          <Link to="/testbed" style={styles.testbedLink}>
            → Testbed 에서 실행
          </Link>
        </div>
      </Section>

      {pending && (
        <ReasonPromptModal
          title={
            pending === "suspend"
              ? `"${clone.name}" 비활성화(일시 중지)`
              : pending === "delete"
                ? `"${clone.name}" 삭제`
                : `"${clone.name}" 복구`
          }
          description={
            pending === "suspend"
              ? "외부 노출은 막고 소유자에게는 계속 보이는 중간 상태로 전환합니다. 언제든 해제할 수 있어요."
              : pending === "delete"
                ? "소프트 삭제됩니다. 90일 내 복구 가능하며, 이후 관리자 전용 목록에서만 조회됩니다."
                : "정상 상태로 되돌립니다. 원래 클론 ID가 이미 다른 클론에 재사용된 경우 충돌 오류가 날 수 있어요."
          }
          requireReason={pending !== "restore"}
          confirmLabel={pending === "delete" ? "삭제" : pending === "suspend" ? "비활성화" : "복구"}
          danger={pending === "delete"}
          onCancel={() => setPending(null)}
          onConfirm={runAction}
        />
      )}
    </div>
  );
}

function detailActionBtnStyle(color: string): React.CSSProperties {
  return {
    fontSize: 12,
    padding: "5px 10px",
    backgroundColor: color,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  };
}

function cloneTypeColor(t: string): string {
  return (
    { memlow: "#8b5cf6", friend: "#3b82f6", mentor: "#f59e0b", celeb: "#ef4444" }[t] ??
    "#64748b"
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function JsonView({ value }: { value: unknown }) {
  if (value == null || value === "") {
    return (
      <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
        (설정되지 않음)
      </div>
    );
  }
  return <pre style={styles.pre}>{JSON.stringify(value, null, 2)}</pre>;
}

function ApiChip({ path }: { path: string }) {
  return <span style={styles.apiChip}>{path}</span>;
}

function Genealogy({ gen }: { gen: GenealogyResp }) {

  const buckets: Record<string, Share[]> = {
    parents: [],
    spouse: [],
    siblings: [],
    children: [],
    others: [],
  };
  for (const m of gen.members) {
    if (m.relation === "mother" || m.relation === "father") buckets.parents.push(m);
    else if (m.relation === "spouse") buckets.spouse.push(m);
    else if (m.relation === "sibling") buckets.siblings.push(m);
    else if (m.relation === "child") buckets.children.push(m);
    else buckets.others.push(m);
  }
  return (
    <div style={styles.tree}>
      {buckets.parents.length > 0 && (
        <div style={styles.treeLevel}>
          <div style={styles.treeLevelLabel}>부모</div>
          <div style={styles.treeRow}>
            {buckets.parents.map((p) => (
              <PersonNode key={p.id} share={p} />
            ))}
          </div>
          <div style={styles.treeConnector} />
        </div>
      )}
      <div style={styles.treeLevel}>
        <div style={styles.treeLevelLabel}>본인 (소유자)</div>
        <div style={styles.treeRow}>
          <div
            style={{
              ...styles.personBox,
              borderColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            }}
          >
            <div style={styles.personName}>
              {gen.root.name} #{gen.root.userId}
            </div>
            <div style={styles.personRel}>self · owner</div>
          </div>
          {buckets.spouse.map((s) => (
            <PersonNode key={s.id} share={s} />
          ))}
        </div>
        {(buckets.siblings.length > 0 || buckets.children.length > 0) && (
          <div style={styles.treeConnector} />
        )}
      </div>
      {buckets.siblings.length > 0 && (
        <div style={styles.treeLevel}>
          <div style={styles.treeLevelLabel}>형제자매</div>
          <div style={styles.treeRow}>
            {buckets.siblings.map((s) => (
              <PersonNode key={s.id} share={s} />
            ))}
          </div>
        </div>
      )}
      {buckets.children.length > 0 && (
        <div style={styles.treeLevel}>
          <div style={styles.treeLevelLabel}>자녀</div>
          <div style={styles.treeRow}>
            {buckets.children.map((s) => (
              <PersonNode key={s.id} share={s} />
            ))}
          </div>
        </div>
      )}
      {buckets.others.length > 0 && (
        <div style={styles.treeLevel}>
          <div style={styles.treeLevelLabel}>기타 관계</div>
          <div style={styles.treeRow}>
            {buckets.others.map((s) => (
              <PersonNode key={s.id} share={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonNode({ share }: { share: Share }) {
  return (
    <div style={styles.personBox}>
      <div style={styles.personName}>
        {share.targetUserName ?? share.inviteEmail ?? "(미수락)"}
        {share.targetUserId ? ` #${share.targetUserId}` : ""}
      </div>
      <div style={styles.personRel}>
        {share.relation
          ? RELATION_LABEL[share.relation] ?? share.relation
          : "?"}{" "}
        · {share.role}
      </div>
      <span
        style={{
          ...styles.statusBadge,
          backgroundColor: STATUS_COLOR[share.status] ?? "#64748b",
          marginTop: 4,
        }}
      >
        {share.status}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  back: { display: "inline-block", marginBottom: 12, color: "#3b82f6" },
  titleRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  typeBadge: {
    color: "#fff",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  visBadge: {
    color: "#64748b",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    border: "1px solid #cbd5e1",
  },
  metaRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
    color: "#64748b",
    fontSize: 13,
  },
  meta: {},
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "16px 20px",
    border: "1px solid #e2e8f0",
  },
  statValue: { fontSize: 24, fontWeight: 700, color: "#1e293b" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    border: "1px solid #e2e8f0",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, marginTop: 0, marginBottom: 12, color: "#1e293b" },
  desc: { color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" },
  pre: {
    margin: 0,
    padding: 12,
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    borderRadius: 6,
    fontSize: 12,
    overflow: "auto",
    maxHeight: 400,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #f1f5f9",
  },
  statusBadge: {
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    display: "inline-block",
  },

  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
  },
  apiChip: {
    fontFamily: "monospace",
    fontSize: 12,
    padding: "4px 10px",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  testbedLink: {
    fontSize: 12,
    padding: "4px 10px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
    alignSelf: "center",
  },
  tree: { display: "flex", flexDirection: "column", gap: 16 },
  treeLevel: { display: "flex", flexDirection: "column", alignItems: "center" },
  treeLevelLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
    fontWeight: 700,
  },
  treeRow: { display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  treeConnector: { width: 2, height: 16, backgroundColor: "#cbd5e1", marginTop: 8 },
  personBox: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    minWidth: 140,
    textAlign: "center",
  },
  personName: { fontSize: 13, fontWeight: 600, color: "#1e293b" },
  personRel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  err: {
    padding: 12,
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 6,
  },
};
