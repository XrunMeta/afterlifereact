

export type CurrentlyRunningLike = {
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch?: boolean;
  updateId?: string;
};

export function formatOtaLine(info: CurrentlyRunningLike): string {
  if (info.isEmergencyLaunch) return "OTA 비상실행(embedded fallback)";
  if (info.isEmbeddedLaunch) return "OTA 내장(embedded)";
  const shortId = (info.updateId ?? "").slice(0, 8) || "—";
  return `OTA ${shortId}`;
}

export function formatVersionLine(
  version: string | undefined,
  iosBuild: string | undefined,
  androidVersionCode: number | undefined,
): string {
  const v = version ?? "?";
  const build = iosBuild ?? (androidVersionCode != null ? String(androidVersionCode) : "?");
  return `v${v} (${build})`;
}
