

export function formatRelativeKo(iso: string): string {
  try {
    const ms = new Date(iso.replace(" ", "T") + (iso.includes("T") || iso.endsWith("Z") ? "" : "Z")).getTime();
    if (Number.isNaN(ms)) return "";
    const diff = Date.now() - ms;
    if (diff < 30_000) return "방금";
    const min = Math.floor(diff / 60_000);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const d = Math.floor(hr / 24);
    if (d < 7) return `${d}일 전`;
    if (d < 30) return `${Math.floor(d / 7)}주 전`;
    return new Date(ms).toLocaleDateString();
  } catch {
    return "";
  }
}
