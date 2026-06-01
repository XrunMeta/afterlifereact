

export interface SystemPersona {
  rules_text: string;
  blocklist: string[];
}

export async function v_b60bdd(v_a1651b): Promise<SystemPersona> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id = 1")
    .first<{ rules_text: string; blocklist: string }>();
  if (!v_3ac7e7) return { rules_text: "", blocklist: [] };
  let v_33f5f0 = [];
  try {
    const v_8decf8 = JSON.parse(v_3ac7e7.blocklist ?? "[]");
    if (Array.isArray(v_8decf8)) v_33f5f0 = v_8decf8.filter((v_62c214): v_62c214 is string => typeof v_62c214 === "string");
  } catch {
    v_33f5f0 = [];
  }
  return { rules_text: v_3ac7e7.rules_text ?? "", blocklist: v_33f5f0 };
}
