import { useState } from "react";

interface ReasonPromptModalProps {
  title: string;
  description?: string;
  requireReason?: boolean;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

const MIN_REASON_LENGTH = 10;

export function ReasonPromptModal({
  title,
  description,
  requireReason = true,
  confirmLabel = "확인",
  danger = false,
  onCancel,
  onConfirm,
}: ReasonPromptModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = reason.trim();
  const invalid = requireReason && trimmed.length < MIN_REASON_LENGTH;

  const handleConfirm = async () => {
    if (invalid) {
      setError(`사유는 최소 ${MIN_REASON_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (e) {
      setError((e as Error).message || "처리 중 오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{title}</h2>
        {description && <p style={styles.desc}>{description}</p>}
        <textarea
          style={styles.textarea}
          placeholder={
            requireReason
              ? `사유를 입력해 주세요 (최소 ${MIN_REASON_LENGTH}자)`
              : "사유(선택 입력)"
          }
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          autoFocus
        />
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={submitting}>
            취소
          </button>
          <button
            style={{ ...styles.confirmBtn, ...(danger ? styles.dangerBtn : {}) }}
            onClick={handleConfirm}
            disabled={submitting || invalid}
          >
            {submitting ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
