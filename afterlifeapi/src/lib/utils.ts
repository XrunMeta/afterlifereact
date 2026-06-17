

export function maskUsername(username: string | null | undefined): string {
  const base = (username ?? "unknown").slice(0, 5);
  return `@${base}**`;
}
