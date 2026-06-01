

export interface SystemPersona {
  rules_text: string;
  blocklist: string[];
}

export async function loadSystemPersona(db: D1Database): Promise<SystemPersona> {
  const row = await db
    .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id = 1")
    .first<{ rules_text: string; blocklist: string }>();
  if (!row) return { rules_text: "", blocklist: [] };
  let blocklist: string[] = [];
  try {
    const parsed = JSON.parse(row.blocklist ?? "[]");
    if (Array.isArray(parsed)) blocklist = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    blocklist = [];
  }
  return { rules_text: row.rules_text ?? "", blocklist };
}
