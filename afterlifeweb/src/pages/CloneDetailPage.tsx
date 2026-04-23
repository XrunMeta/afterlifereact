import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_80cb8d, v_1a1e9e } from "pgmzxjkoagjpdcvd";
import { v_8e836f } from "../api/client";

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
}

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

const v_f75ae8 = {
  mother: "어머니",
  father: "아버지",
  spouse: "배우자",
  child: "자녀",
  sibling: "형제자매",
  friend: "친구",
  pet: "반려동물",
  other: "기타",
};

const v_37db67 = {
  accepted: "#10b981",
  pending: "#f59e0b",
  invited: "#8b5cf6",
  rejected: "#ef4444",
};

export function v_6e2f30() {
  const { id: v_389afb } = v_1a1e9e<{ id: string }>();
  const [v_9390e8, v_d57c80] = v_5ab095<DetailResp | null>(null);
  const [v_a936b7, v_c30959] = v_5ab095<GenealogyResp | null>(null);
  const [v_49263d, v_8a5996] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_389afb) return;
    (async () => {
      try {
        const v_d5dda0 = await v_8e836f("GET", `/oth-path${v_389afb}/detail`);
        if (!v_d5dda0.ok) throw new Error(`detail ${v_d5dda0.status}`);
        v_d57c80(v_d5dda0.body as DetailResp);
        const v_206b88 = await v_8e836f("GET", `/oth-path${v_389afb}/genealogy`);
        if (v_206b88.ok) v_c30959(v_206b88.body as GenealogyResp);
      } catch (v_9e86fd) {
        v_8a5996((v_9e86fd as Error).message);
      }
    })();
  }, [v_389afb]);

  if (v_49263d) {
    return (
      <div>
        <h1>Clone Detail</h1>
        <div style={v_d81136.err}>{v_49263d}</div>
        <Link to="/oth-path">← Clones 목록</Link>
      </div>
    );
  }
  if (!v_9390e8) {
    return (
      <div>
        <h1>Clone Detail</h1>
        <p style={{ color: "#94a3b8" }}>Loading...</p>
      </div>
    );
  }

  const { clone: v_eb25ce, shares: v_b99095, stats: v_62676b } = v_9390e8;
  const v_e93e18 = v_eb25ce.cloneType === "memlow";

  return (
    <div>
      <Link to="/oth-path" style={v_d81136.back}>
        ← Clones 목록
      </Link>
      <div style={v_d81136.titleRow}>
        <h1 style={{ margin: 0 }}>
          {v_eb25ce.name}{" "}
          <span style={{ color: "#64748b", fontSize: 16, fontWeight: 400 }}>
            @{v_eb25ce.username}
          </span>
        </h1>
        <span
          style={{
            ...v_d81136.typeBadge,
            backgroundColor: v_4ad497(v_eb25ce.cloneType),
          }}
        >
          {v_eb25ce.cloneType}
        </span>
        <span style={v_d81136.visBadge}>{v_eb25ce.visibility}</span>
      </div>
      <div style={v_d81136.metaRow}>
        <span style={v_d81136.meta}>ID #{v_eb25ce.id}</span>
        <span style={v_d81136.meta}>
          소유자: {v_eb25ce.ownerName ?? "-"} (#{v_eb25ce.ownerId})
        </span>
        <span style={v_d81136.meta}>상태: {v_eb25ce.trainingStatus}</span>
        <span style={v_d81136.meta}>
          생성일: {v_eb25ce.createdAt?.slice(0, 10)}
        </span>
      </div>

      <div style={v_d81136.statsGrid}>
        <StatCard label="Followers" value={v_62676b.followers} />
        <StatCard label="Messages" value={v_62676b.messages} />
        <StatCard label="Coowners" value={v_b99095.length} />
      </div>

      <Section title="설명">
        <div style={v_d81136.desc}>
          {v_eb25ce.description || <span style={{ color: "#94a3b8" }}>(없음)</span>}
        </div>
      </Section>

      {v_e93e18 && v_a936b7 ? (
        <Section title="가계도 (Memlow Genealogy)">
          <Genealogy gen={v_a936b7} />
        </Section>
      ) : null}

      <Section title={`공동 소유자 / 공유 (${v_b99095.length})`}>
        {v_b99095.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>공유 내역 없음</div>
        ) : (
          <table style={v_d81136.table}>
            <thead>
              <tr>
                <th style={v_d81136.th}>ID</th>
                <th style={v_d81136.th}>Target</th>
                <th style={v_d81136.th}>Relation</th>
                <th style={v_d81136.th}>Role</th>
                <th style={v_d81136.th}>Status</th>
                <th style={v_d81136.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {v_b99095.map((v_fd5f43) => (
                <tr key={v_fd5f43.id}>
                  <td style={v_d81136.td}>#{v_fd5f43.id}</td>
                  <td style={v_d81136.td}>
                    {v_fd5f43.targetUserName ?? v_fd5f43.inviteEmail ?? "-"}
                    {v_fd5f43.targetUserId ? ` (#${v_fd5f43.targetUserId})` : ""}
                  </td>
                  <td style={v_d81136.td}>
                    {v_fd5f43.relation
                      ? v_f75ae8[v_fd5f43.relation] ?? v_fd5f43.relation
                      : "-"}
                  </td>
                  <td style={v_d81136.td}>{v_fd5f43.role}</td>
                  <td style={v_d81136.td}>
                    <span
                      style={{
                        ...v_d81136.statusBadge,
                        backgroundColor:
                          v_37db67[v_fd5f43.status] ?? "#64748b",
                      }}
                    >
                      {v_fd5f43.status}
                    </span>
                  </td>
                  <td style={v_d81136.td}>{v_fd5f43.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="페르소나 — L1 Profile (핵심 특성)">
        <JsonView value={v_eb25ce.l1Profile} />
      </Section>
      <Section title="페르소나 — L2 Profile (맥락/기억 요약)">
        <JsonView value={v_eb25ce.l2Profile} />
      </Section>

      <Section title="관련 API">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/detail`} />
          {v_e93e18 && (
            <ApiChip path={`GET /oth-path${v_eb25ce.id}/genealogy`} />
          )}
          <ApiChip path={`GET /oth-path${v_eb25ce.id}`} />
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/oth-path`} />
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/messages`} />
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/shares`} />
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/memory/l1`} />
          <ApiChip path={`GET /oth-path${v_eb25ce.id}/memory/l2`} />
          <Link to="/testbed" style={v_d81136.testbedLink}>
            → Testbed 에서 실행
          </Link>
        </div>
      </Section>
    </div>
  );
}

function v_4ad497(v_8d41d7): string {
  return (
    { memlow: "#8b5cf6", friend: "#3b82f6", mentor: "#f59e0b", celeb: "#ef4444" }[v_8d41d7] ??
    "#64748b"
  );
}

function v_e8c34f({ label: v_2869c1, value: v_3b402b }: { label: string; value: number }) {
  return (
    <div style={v_d81136.statCard}>
      <div style={v_d81136.statValue}>{v_3b402b}</div>
      <div style={v_d81136.statLabel}>{v_2869c1}</div>
    </div>
  );
}

function v_8c6e3a({
  title: v_9f1622,
  children: v_21f619,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={v_d81136.section}>
      <h2 style={v_d81136.sectionTitle}>{v_9f1622}</h2>
      {v_21f619}
    </div>
  );
}

function v_72677f({ value: v_3b402b }: { value: unknown }) {
  if (v_3b402b == null || v_3b402b === "") {
    return (
      <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
        (설정되지 않음)
      </div>
    );
  }
  return <pre style={v_d81136.pre}>{JSON.stringify(v_3b402b, null, 2)}</pre>;
}

function v_5dec6b({ path: v_9fe22d }: { path: string }) {
  return <span style={v_d81136.apiChip}>{v_9fe22d}</span>;
}

function v_d5832a({ gen: v_a936b7 }: { gen: GenealogyResp }) {

  const v_133457 = {
    parents: [],
    spouse: [],
    siblings: [],
    children: [],
    others: [],
  };
  for (const v_35f85c of v_a936b7.members) {
    if (v_35f85c.relation === "mother" || v_35f85c.relation === "father") v_133457.parents.push(v_35f85c);
    else if (v_35f85c.relation === "spouse") v_133457.spouse.push(v_35f85c);
    else if (v_35f85c.relation === "sibling") v_133457.siblings.push(v_35f85c);
    else if (v_35f85c.relation === "child") v_133457.children.push(v_35f85c);
    else v_133457.others.push(v_35f85c);
  }
  return (
    <div style={v_d81136.tree}>
      {v_133457.parents.length > 0 && (
        <div style={v_d81136.treeLevel}>
          <div style={v_d81136.treeLevelLabel}>부모</div>
          <div style={v_d81136.treeRow}>
            {v_133457.parents.map((v_e2a85c) => (
              <PersonNode key={v_e2a85c.id} share={v_e2a85c} />
            ))}
          </div>
          <div style={v_d81136.treeConnector} />
        </div>
      )}
      <div style={v_d81136.treeLevel}>
        <div style={v_d81136.treeLevelLabel}>본인 (소유자)</div>
        <div style={v_d81136.treeRow}>
          <div
            style={{
              ...v_d81136.personBox,
              borderColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            }}
          >
            <div style={v_d81136.personName}>
              {v_a936b7.root.name} #{v_a936b7.root.userId}
            </div>
            <div style={v_d81136.personRel}>self · owner</div>
          </div>
          {v_133457.spouse.map((v_fd5f43) => (
            <PersonNode key={v_fd5f43.id} share={v_fd5f43} />
          ))}
        </div>
        {(v_133457.siblings.length > 0 || v_133457.children.length > 0) && (
          <div style={v_d81136.treeConnector} />
        )}
      </div>
      {v_133457.siblings.length > 0 && (
        <div style={v_d81136.treeLevel}>
          <div style={v_d81136.treeLevelLabel}>형제자매</div>
          <div style={v_d81136.treeRow}>
            {v_133457.siblings.map((v_fd5f43) => (
              <PersonNode key={v_fd5f43.id} share={v_fd5f43} />
            ))}
          </div>
        </div>
      )}
      {v_133457.children.length > 0 && (
        <div style={v_d81136.treeLevel}>
          <div style={v_d81136.treeLevelLabel}>자녀</div>
          <div style={v_d81136.treeRow}>
            {v_133457.children.map((v_fd5f43) => (
              <PersonNode key={v_fd5f43.id} share={v_fd5f43} />
            ))}
          </div>
        </div>
      )}
      {v_133457.others.length > 0 && (
        <div style={v_d81136.treeLevel}>
          <div style={v_d81136.treeLevelLabel}>기타 관계</div>
          <div style={v_d81136.treeRow}>
            {v_133457.others.map((v_fd5f43) => (
              <PersonNode key={v_fd5f43.id} share={v_fd5f43} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function v_294525({ share: v_c2bdf9 }: { share: Share }) {
  return (
    <div style={v_d81136.personBox}>
      <div style={v_d81136.personName}>
        {v_c2bdf9.targetUserName ?? v_c2bdf9.inviteEmail ?? "(미수락)"}
        {v_c2bdf9.targetUserId ? ` #${v_c2bdf9.targetUserId}` : ""}
      </div>
      <div style={v_d81136.personRel}>
        {v_c2bdf9.relation
          ? v_f75ae8[v_c2bdf9.relation] ?? v_c2bdf9.relation
          : "?"}{" "}
        · {v_c2bdf9.role}
      </div>
      <span
        style={{
          ...v_d81136.statusBadge,
          backgroundColor: v_37db67[v_c2bdf9.status] ?? "#64748b",
          marginTop: 4,
        }}
      >
        {v_c2bdf9.status}
      </span>
    </div>
  );
}

const v_d81136 = {
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
