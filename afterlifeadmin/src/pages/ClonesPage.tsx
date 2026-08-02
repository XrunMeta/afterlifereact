import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_80cb8d } from "pgmzxjkoagjpdcvd";
import { v_05a921, type v_daa264 } from "../api/client";
import { v_c1eeb6 } from "../components/DataTable";
import { v_f3f4f0 } from "../components/ReasonPromptModal";

const v_ff2fa5 = {
  active: { label: "활성", color: "#15803d", bg: "#dcfce7" },
  soft_deleted: { label: "삭제됨(복구가능)", color: "#b45309", bg: "#fef3c7" },
  hard_deleted: { label: "영구 삭제", color: "#b91c1c", bg: "#fee2e2" },
  archived_cold: { label: "보관됨", color: "#1d4ed8", bg: "#dbeafe" },
};
const v_9f536f = (v_81e2ef) => {
  const v_34d5e3 = v_ff2fa5[v_81e2ef ?? "active"] ?? { label: v_81e2ef ?? "—", color: "#52525b", bg: "#f4f4f5" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: v_34d5e3.color,
        backgroundColor: v_34d5e3.bg,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {v_34d5e3.label}
    </span>
  );
};

const v_26edb7 = (row: v_daa264) => {
  if (!v_3ac7e7.adminSuspendedAt) return null;
  return (
    <span
      title={v_3ac7e7.adminSuspendReason ?? undefined}
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

const v_52701d = {
  background: "#D4A017",
  color: "#fff",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 12,
  fontWeight: 700,
};

const v_c9798c = (v_81e2ef) => {
  if (v_81e2ef === "expert") {
    return <span style={v_52701d}>전문가</span>;
  }
  return v_81e2ef;
};

const v_0579fb = [
  { value: "", label: "활성 클론 (기본)" },
  { value: "soft_deleted", label: "삭제된 클론" },
  { value: "archived_cold", label: "보관됨(cold)" },
];

const v_e8d408 = 20;

type PendingAction =
  | { kind: "suspend"; clone: v_daa264 }
  | { kind: "delete"; clone: v_daa264 }
  | { kind: "restore"; clone: v_daa264 };

export function v_c7f476() {
  const [v_f891e6, v_3302bc] = v_5ab095<v_daa264[]>([]);
  const [v_c83285, v_8eee5e] = v_5ab095(0);
  const [v_3bbadf, v_919214] = v_5ab095(0);
  const [v_9d030b, v_45fbb9] = v_5ab095("");

  const [v_0dfeb6, v_a5c0e5] = v_5ab095(false);
  const [v_ab6401, v_8bd32f] = v_5ab095("");
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_483de2, v_266e0d] = v_5ab095<PendingAction | null>(null);

  const v_f6f5de = () => {
    v_34a50a(true);
    v_05a921
      .getClones({
        deletionState: v_9d030b || undefined,
        suspended: v_0dfeb6 ? true : undefined,
        q: v_ab6401 || undefined,
        offset: v_3bbadf,
        limit: v_e8d408,
      })
      .then((v_8f00b9) => {
        v_3302bc(v_8f00b9.items);
        v_8eee5e(v_8f00b9.total);
      })
      .catch(console.error)
      .finally(() => v_34a50a(false));
  };

  v_c4deb2(v_f6f5de, [v_9d030b, v_0dfeb6, v_3bbadf]);

  const v_1d6a6c = () => {
    v_919214(0);
    v_f6f5de();
  };

  const v_cf5469 = () => v_266e0d(null);

  const v_776d00 = async (v_58ca36) => {
    if (!v_483de2) return;
    if (v_483de2.kind === "suspend") {
      await v_05a921.suspendClone(v_483de2.clone.id, v_58ca36);
    } else if (v_483de2.kind === "delete") {
      await v_05a921.deleteClone(v_483de2.clone.id, v_58ca36);
    } else {
      await v_05a921.restoreClone(v_483de2.clone.id, v_58ca36 || undefined);
    }
    v_266e0d(null);
    v_f6f5de();
  };

  const v_a64a6d = (row: v_daa264) => {
    const v_26dce6 = v_3ac7e7.deletionState === "active";
    const v_eb6255 = !!v_3ac7e7.adminSuspendedAt;
    const v_9de4b5 = v_3ac7e7.deletionState === "soft_deleted";
    const v_7e51bc = v_3ac7e7.deletionState === "archived_cold" || v_3ac7e7.deletionState === "hard_deleted";

    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {v_26dce6 && !v_eb6255 && (
          <button style={v_e34037("#f59e0b")} onClick={() => v_266e0d({ kind: "suspend", clone: v_3ac7e7 })}>
            비활성화
          </button>
        )}
        {v_26dce6 && v_eb6255 && (
          <button style={v_e34037("#3b82f6")} onClick={() => v_266e0d({ kind: "restore", clone: v_3ac7e7 })}>
            중지 해제
          </button>
        )}
        {v_26dce6 && (
          <button style={v_e34037("#ef4444")} onClick={() => v_266e0d({ kind: "delete", clone: v_3ac7e7 })}>
            삭제
          </button>
        )}
        {v_9de4b5 && (
          <button style={v_e34037("#3b82f6")} onClick={() => v_266e0d({ kind: "restore", clone: v_3ac7e7 })}>
            복구
          </button>
        )}
        {v_7e51bc && (
          <Link to="/oth-path" style={{ fontSize: 12, color: "#1d4ed8" }}>
            cold-recovery 에서 복구
          </Link>
        )}
      </div>
    );
  };

  const v_b9fa58 = [
    { key: "id", label: "ID" },
    {
      key: "deletionState",
      label: "상태",
      render: (v_81e2ef, row?: v_daa264) => (
        <>
          {v_9f536f(v_81e2ef)}
          {v_3ac7e7 && v_26edb7(v_3ac7e7)}
        </>
      ),
    },
    { key: "name", label: "Name" },
    { key: "username", label: "클론 ID" },
    { key: "cloneType", label: "Type", render: v_c9798c },
    { key: "visibility", label: "Visibility" },
    { key: "trainingStatus", label: "Status" },
    { key: "ownerName", label: "Owner" },
    { key: "createdAt", label: "Created", render: (v_81e2ef) => v_81e2ef?.slice(0, 10) ?? "" },
    {
      key: "actions",
      label: "Actions",
      render: (v_e79916, row: v_daa264) => v_a64a6d(v_3ac7e7),
    },
    {
      key: "detail",
      label: "Detail",
      render: (v_e79916, v_3ac7e7) => (
        <Link
          to={`/oth-path${v_3ac7e7.id}`}
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

  const v_2365e9 = Math.floor(v_3bbadf / v_e8d408) + 1;
  const v_ed256a = Math.max(1, Math.ceil(v_c83285 / v_e8d408));

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Clones</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={v_9d030b}
          onChange={(v_9e86fd) => {
            v_45fbb9(v_9e86fd.target.value);
            v_919214(0);
          }}
          style={v_e9ebd3}
        >
          {v_0579fb.map((v_8b5cd8) => (
            <option key={v_8b5cd8.value} value={v_8b5cd8.value}>
              {v_8b5cd8.label}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155" }}>
          <input
            type="checkbox"
            checked={v_0dfeb6}
            onChange={(v_9e86fd) => {
              v_a5c0e5(v_9e86fd.target.checked);
              v_919214(0);
            }}
          />
          일시중지만 보기
        </label>
        <input
          placeholder="이름 / 클론ID / 소유자 검색"
          value={v_ab6401}
          onChange={(v_9e86fd) => v_8bd32f(v_9e86fd.target.value)}
          onKeyDown={(v_9e86fd) => v_9e86fd.key === "Enter" && v_1d6a6c()}
          style={{ ...v_e9ebd3, width: 240 }}
        />
        <button style={v_e34037("#3b82f6")} onClick={v_1d6a6c}>
          검색
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          총 {v_c83285}건 · {v_2365e9}/{v_ed256a} 페이지
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            style={v_e34037("#64748b")}
            disabled={v_3bbadf === 0}
            onClick={() => v_919214(Math.max(0, v_3bbadf - v_e8d408))}
          >
            이전
          </button>
          <button
            style={v_e34037("#64748b")}
            disabled={v_3bbadf + v_e8d408 >= v_c83285}
            onClick={() => v_919214(v_3bbadf + v_e8d408)}
          >
            다음
          </button>
        </div>
      </div>

      <DataTable columns={v_b9fa58} data={v_f891e6} loading={v_683210} />

      {v_483de2 && (
        <ReasonPromptModal
          title={
            v_483de2.kind === "suspend"
              ? `"${v_483de2.clone.name}" 비활성화(일시 중지)`
              : v_483de2.kind === "delete"
                ? `"${v_483de2.clone.name}" 삭제`
                : `"${v_483de2.clone.name}" 복구`
          }
          description={
            v_483de2.kind === "suspend"
              ? "외부 노출은 막고 소유자에게는 계속 보이는 중간 상태로 전환합니다. 언제든 해제할 수 있어요."
              : v_483de2.kind === "delete"
                ? "소프트 삭제됩니다. 90일 내 복구 가능하며, 이후 관리자 전용 목록에서만 조회됩니다."
                : "정상 상태로 되돌립니다. 원래 클론 ID가 이미 다른 클론에 재사용된 경우 충돌 오류가 날 수 있어요."
          }
          requireReason={v_483de2.kind !== "restore"}
          confirmLabel={v_483de2.kind === "delete" ? "삭제" : v_483de2.kind === "suspend" ? "비활성화" : "복구"}
          danger={v_483de2.kind === "delete"}
          onCancel={v_cf5469}
          onConfirm={v_776d00}
        />
      )}
    </div>
  );
}

function v_e34037(v_3c2a3a): React.CSSProperties {
  return {
    fontSize: 12,
    padding: "5px 10px",
    backgroundColor: v_3c2a3a,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  };
}

const v_e9ebd3 = {
  fontSize: 13,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
};
