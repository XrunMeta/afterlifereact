

export interface VoicePresetNameInput {
  name: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameZhCn?: string | null;
  nameId?: string | null;
}

type TranslateFn = (
  key: string,
  options?: { defaultValue?: string },
) => string;

export function v_d7b329(
  v_324e3c,
  v_5254bf,
  v_8d41d7,
): string {
  if (!v_324e3c) return "";
  const v_0debf4 = v_324e3c.name;
  const v_c99bd2 = (v_5254bf ?? "").toLowerCase();
  if (v_c99bd2.startsWith("ko")) return v_0debf4;

  let v_38db88;
  if (v_c99bd2.startsWith("en")) v_38db88 = v_324e3c.nameEn;
  else if (v_c99bd2.startsWith("ja")) v_38db88 = v_324e3c.nameJa;
  else if (v_c99bd2.startsWith("zh")) v_38db88 = v_324e3c.nameZhCn;
  else if (v_c99bd2.startsWith("id")) v_38db88 = v_324e3c.nameId;
  else return v_0debf4;

  const v_2f361a = v_38db88?.trim();
  if (v_2f361a) return v_2f361a;

  if (v_8d41d7) {
    const v_b24339 = `create.voice.presetNames.${v_0debf4}`;
    const v_e1a8a8 = v_8d41d7(v_b24339, { defaultValue: "" });
    if (v_e1a8a8.trim() && v_e1a8a8 !== v_b24339) return v_e1a8a8.trim();
  }

  return v_0debf4;
}
