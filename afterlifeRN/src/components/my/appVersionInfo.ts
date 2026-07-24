

export type CurrentlyRunningLike = {
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch?: boolean;
  updateId?: string;
};

export function v_3752e7(v_34d5e3): string {
  if (v_34d5e3.isEmergencyLaunch) return "OTA 비상실행(embedded fallback)";
  if (v_34d5e3.isEmbeddedLaunch) return "OTA 내장(embedded)";
  const v_53aa09 = (v_34d5e3.updateId ?? "").slice(0, 8) || "—";
  return `OTA ${v_53aa09}`;
}

export function v_8f6de1(
  v_0e1851,
  v_807c28,
): string {
  const v_81e2ef = v_0e1851 ?? "?";
  const v_148ff6 = v_807c28 != null && `${v_807c28}` !== "" ? `${v_807c28}` : "?";
  return `v${v_81e2ef} (${v_148ff6})`;
}
