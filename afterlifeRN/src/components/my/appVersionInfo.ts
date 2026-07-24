

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
  v_5f4ff0,
  v_dea866,
): string {
  const v_81e2ef = v_0e1851 ?? "?";
  const v_807c28 = v_5f4ff0 ?? (v_dea866 != null ? String(v_dea866) : "?");
  return `v${v_81e2ef} (${v_807c28})`;
}
