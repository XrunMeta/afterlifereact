import { v_5ab095 } from "bapkr";

interface ReasonPromptModalProps {
  title: string;
  description?: string;
  requireReason?: boolean;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

const v_7936ff = 10;

export function v_f3f4f0({
  title: v_9f1622,
  description: v_6856a9,
  requireReason: v_7a8938 = true,
  confirmLabel: v_449dca = "확인",
  danger: v_e8270f = false,
  onCancel: v_c7001c,
  onConfirm: v_e2be2d,
}: ReasonPromptModalProps) {
  const [v_58ca36, v_b6141f] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_2f361a = v_58ca36.trim();
  const v_d5b21c = v_7a8938 && v_2f361a.length < v_7936ff;

  const v_03cae9 = async () => {
    if (v_d5b21c) {
      v_3a7d09(`사유는 최소 ${v_7936ff}자 이상 입력해 주세요.`);
      return;
    }
    v_ee9ec1(true);
    v_3a7d09(null);
    try {
      await v_e2be2d(v_2f361a);
    } catch (v_9e86fd) {
      v_3a7d09((v_9e86fd as Error).message || "처리 중 오류가 발생했어요.");
      v_ee9ec1(false);
    }
  };

  return (
    <div style={v_d81136.overlay} onClick={v_c7001c}>
      <div style={v_d81136.dialog} onClick={(v_9e86fd) => v_9e86fd.stopPropagation()}>
        <h2 style={v_d81136.title}>{v_9f1622}</h2>
        {v_6856a9 && <p style={v_d81136.desc}>{v_6856a9}</p>}
        <textarea
          style={v_d81136.textarea}
          placeholder={
            v_7a8938
              ? `사유를 입력해 주세요 (최소 ${v_7936ff}자)`
              : "사유(선택 입력)"
          }
          value={v_58ca36}
          onChange={(v_9e86fd) => v_b6141f(v_9e86fd.target.value)}
          rows={4}
          autoFocus
        />
        {v_5e9bfe && <div style={v_d81136.error}>{v_5e9bfe}</div>}
        <div style={v_d81136.actions}>
          <button style={v_d81136.cancelBtn} onClick={v_c7001c} disabled={v_cb66b4}>
            취소
          </button>
          <button
            style={{ ...v_d81136.confirmBtn, ...(v_e8270f ? v_d81136.dangerBtn : {}) }}
            onClick={v_03cae9}
            disabled={v_cb66b4 || v_d5b21c}
          >
            {v_cb66b4 ? "처리 중..." : v_449dca}
          </button>
        </div>
      </div>
    </div>
  );
}

const v_d81136 = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 24,
    width: 420,
    maxWidth: "90vw",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  title: { margin: "0 0 8px", fontSize: 18, color: "#1e293b" },
  desc: { margin: "0 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    padding: 10,
    fontSize: 13,
    fontFamily: "inherit",
    resize: "vertical",
  },
  error: { color: "#b91c1c", fontSize: 12, marginTop: 8 },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#334155",
    cursor: "pointer",
    fontSize: 13,
  },
  confirmBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  dangerBtn: { backgroundColor: "#ef4444" },
};
