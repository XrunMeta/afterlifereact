

export interface VoicePresetNameInput {
  name: string;
  nameEn?: string | null;
  nameJa?: string | null;
  nameZhCn?: string | null;
  nameId?: string | null;
}

export function resolveVoicePresetName(
  preset: VoicePresetNameInput | null | undefined,
  lang: string | undefined | null,
): string {
  if (!preset) return "";
  const fallback = preset.name;
  const code = (lang ?? "").toLowerCase();
  if (code.startsWith("ko")) return fallback;
  if (code.startsWith("en")) return preset.nameEn?.trim() || fallback;
  if (code.startsWith("ja")) return preset.nameJa?.trim() || fallback;
  if (code.startsWith("zh")) return preset.nameZhCn?.trim() || fallback;
  if (code.startsWith("id")) return preset.nameId?.trim() || fallback;
  return fallback;
}
