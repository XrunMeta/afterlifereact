

export function v_8cf86b(v_e0c7e8): string | null {
  if (!v_e0c7e8) return null;
  return `${(v_e0c7e8.split("@")[0] ?? "").slice(0, 3)}***`;
}

export function v_5acfc3(v_556427): string {
  const v_694b25 = (v_556427 ?? "unknown").slice(0, 5);
  return `@${v_694b25}**`;
}
