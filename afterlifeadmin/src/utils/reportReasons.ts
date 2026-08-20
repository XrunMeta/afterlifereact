

export const REPORT_REASONS = [
  "마음에 들지 않습니다",
  "따돌림 또는 원치 않는 연락",
  "자살, 자해 및 섭식 장애",
  "나체 이미지 또는 성적 행위",
  "혐오 발언 또는 상징",
  "폭력 또는 학대",
  "규제 품목의 판매 또는 홍보",
  "스캠, 사기 또는 스팸",
  "거짓 정보",
] as const;

export type PresetReason = (typeof REPORT_REASONS)[number];

export type Severity = "red" | "orange" | "amber" | "gray";

const SEVERITY_MAP: Record<PresetReason, Severity> = {
  "마음에 들지 않습니다": "gray",
  "따돌림 또는 원치 않는 연락": "amber",
  "자살, 자해 및 섭식 장애": "red",
  "나체 이미지 또는 성적 행위": "red",
  "혐오 발언 또는 상징": "red",
  "폭력 또는 학대": "red",
  "규제 품목의 판매 또는 홍보": "orange",
  "스캠, 사기 또는 스팸": "orange",
  "거짓 정보": "orange",
};

export const SEVERITY_COLORS: Record<Severity, { color: string; bg: string; border: string }> = {
  red:    { color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  orange: { color: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
  amber:  { color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  gray:   { color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};

export const severityForReason = (reason: string | null | undefined): Severity => {
  if (!reason) return "gray";
  return SEVERITY_MAP[reason as PresetReason] ?? "gray";
};

export const isPresetReason = (reason: string | null | undefined): boolean => {
  if (!reason) return false;
  return (REPORT_REASONS as readonly string[]).includes(reason);
};
