import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AdminCloneListItem } from "../api/client";
import { DataTable } from "../components/DataTable";
import { ReasonPromptModal } from "../components/ReasonPromptModal";

const DELETION_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "삭제됨(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
  archived_cold: { label: "보관됨", color: "#1d4ed8", bg: "#dbeafe" },
};
const renderDeletionState = (v?: string) => {
  const info = DELETION_BADGE[v ?? "active"] ?? { label: v ?? "—", color: "#52525b", bg: "#f4f4f5" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: info.color,
        backgroundColor: info.bg,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {info.label}
    </span>
  );
};

const renderSuspendBadge = (row: AdminCloneListItem) => {
  if (!row.adminSuspendedAt) return null;
  return (
    <span
      title={row.adminSuspendReason ?? undefined}
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#9a3412",
        backgroundColor: "#ffedd5",
        padding: "2px 8px",
        borderRadius: 4,
        marginLeft: 4,
      }}
    >
      일시중지
    </span>
  );
};

const EXPERT_BADGE_STYLE: React.CSSProperties = {
  background: "#D4A017",
  color: "#fff",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 12,
  fontWeight: 700,
};

const renderCloneType = (v?: string) => {
  if (v === "expert") {
    return <span style={EXPERT_BADGE_STYLE}>전문가</span>;
  }
  return v;
};

const DELETION_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "활성 클론 (기본)" },
  { value: "soft_deleted", label: "삭제된 클론" },
  { value: "archived_cold", label: "보관됨(cold)" },
];

const PAGE_SIZE = 20;

type PendingAction =
  | { kind: "suspend"; clone: AdminCloneListItem }
  | { kind: "delete"; clone: AdminCloneListItem }
  | { kind: "restore"; clone: AdminCloneListItem };

export function ClonesPage() {
  const [clones, setClones] = useState<AdminCloneListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [deletionState, setDeletionState] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getClones({ deletionState: deletionState || undefined, q: q || undefined, offset, limit: PAGE_SIZE })
      .then((res) => {
        setClones(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [deletionState, offset]);

  const runSearch = () => {
    setOffset(0);
    load();
  };

  const closeModal = () => setPending(null);

  const runAction = async (reason: string) => {
    if (!pending) return;
    if (pending.kind === "suspend") {
      await api.suspendClone(pending.clone.id, reason);
    } else if (pending.kind === "delete") {
      await api.deleteClone(pending.clone.id, reason);
    } else {
      await api.restoreClone(pending.clone.id, reason || undefined);
    }
    setPending(null);
    load();
  };

  const renderActions = (row: AdminCloneListItem) => {
    const isActive = row.deletionState === "active";
    const isSuspended = !!row.adminSuspendedAt;
    const isSoftDeleted = row.deletionState === "soft_deleted";
    const isColdOrHard = row.deletionState === "archived_cold" || row.deletionState === "hard_deleted";

    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {isActive && !isSuspended && (
          <button style={actionBtnStyle("#f59e0b")} onClick={() => setPending({ kind: "suspend", clone: row })}>
            비활성화
          </button>
        )}
        {isActive && isSuspended && (
          <button style={actionBtnStyle("#3b82f6")} onClick={() => setPending({ kind: "restore", clone: row })}>
            중지 해제
          </button>
        )}
        {isActive && (
          <button style={actionBtnStyle("#ef4444")} onClick={() => setPending({ kind: "delete", clone: row })}>
            삭제
          </button>
        )}
        {isSoftDeleted && (
          <button style={actionBtnStyle("#3b82f6")} onClick={() => setPending({ kind: "restore", clone: row })}>
            복구
          </button>
        )}
        {isColdOrHard && (
          <Link to="/oth-path" style={{ fontSize: 12, color: "#1d4ed8" }}>
            cold-recovery 에서 복구
          </Link>
        )}
      </div>
    );
  };

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "deletionState",
      label: "상태",
      render: (v?: string, row?: AdminCloneListItem) => (
        <>
          {renderDeletionState(v)}
          {row && renderSuspendBadge(row)}
        </>
      ),
    },
    { key: "name", label: "Name" },
    { key: "username", label: "클론 ID" },
    { key: "cloneType", label: "Type", render: renderCloneType },
    { key: "visibility", label: "Visibility" },
    { key: "trainingStatus", label: "Status" },
    { key: "ownerName", label: "Owner" },
    { key: "createdAt", label: "Created", render: (v?: string) => v?.slice(0, 10) ?? "" },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: AdminCloneListItem) => renderActions(row),
    },
    {
      key: "detail",
      label: "Detail",
      render: (_v: unknown, row: { id: number }) => (
        <Link
          to={`/oth-path${row.id}`}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          보기
        </Link>
      ),
    },
  ];

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Clones</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={deletionState}
          onChange={(e) => {
            setDeletionState(e.target.value);
            setOffset(0);
          }}
          style={filterStyle}
        >
          {DELETION_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          placeholder="이름 / 클론ID / 소유자 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          style={{ ...filterStyle, width: 240 }}
        />
        <button style={actionBtnStyle("#3b82f6")} onClick={runSearch}>
          검색
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          총 {total}건 · {page}/{pageCount} 페이지
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            style={actionBtnStyle("#64748b")}
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            이전
          </button>
          <button
            style={actionBtnStyle("#64748b")}
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            다음
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={clones} loading={loading} />

      {pending && (
        <ReasonPromptModal
          title={
            pending.kind === "suspend"
              ? `"${pending.clone.name}" 비활성화(일시 중지)`
              : pending.kind === "delete"
                ? `"${pending.clone.name}" 삭제`
                : `"${pending.clone.name}" 복구`
          }
          description={
            pending.kind === "suspend"
              ? "외부 노출은 막고 소유자에게는 계속 보이는 중간 상태로 전환합니다. 언제든 해제할 수 있어요."
              : pending.kind === "delete"
                ? "소프트 삭제됩니다. 90일 내 복구 가능하며, 이후 관리자 전용 목록에서만 조회됩니다."
                : "정상 상태로 되돌립니다. 원래 클론 ID가 이미 다른 클론에 재사용된 경우 충돌 오류가 날 수 있어요."
          }
          requireReason={pending.kind !== "restore"}
          confirmLabel={pending.kind === "delete" ? "삭제" : pending.kind === "suspend" ? "비활성화" : "복구"}
          danger={pending.kind === "delete"}
          onCancel={closeModal}
          onConfirm={runAction}
        />
      )}
    </div>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
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

const filterStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
};
