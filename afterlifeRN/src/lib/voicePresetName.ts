

export interface VoicePresetNameInput {
  name: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameZhCn?: string | null;
  nameId?: string | null;
}

export function v_d7b329(
  v_324e3c,
  v_5254bf,
): string {
  if (!v_324e3c) return "";
  const v_0debf4 = v_324e3c.name;
  const v_c99bd2 = (v_5254bf ?? "").toLowerCase();
  if (v_c99bd2.startsWith("ko")) return v_0debf4;
  if (v_c99bd2.startsWith("en")) return v_324e3c.nameEn?.trim() || v_0debf4;
  if (v_c99bd2.startsWith("ja")) return v_324e3c.nameJa?.trim() || v_0debf4;
  if (v_c99bd2.startsWith("zh")) return v_324e3c.nameZhCn?.trim() || v_0debf4;
  if (v_c99bd2.startsWith("id")) return v_324e3c.nameId?.trim() || v_0debf4;
  return v_0debf4;
}
