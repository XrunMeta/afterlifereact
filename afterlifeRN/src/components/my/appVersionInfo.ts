

export function formatUpdateTime(d: Date | null | undefined): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export type CurrentlyRunningLike = {
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch?: boolean;
  updateId?: string;
  createdAt?: Date | null;
};

export function formatOtaLine(info: CurrentlyRunningLike): string {
  if (info.isEmergencyLaunch) return "OTA 비상실행(embedded fallback)";
  if (info.isEmbeddedLaunch) return "OTA 내장(embedded)";
  const shortId = (info.updateId ?? "").slice(0, 8) || "—";
  const when = info.createdAt ? ` · ${formatUpdateTime(info.createdAt)}` : "";
  return `OTA ${shortId}${when}`;
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
