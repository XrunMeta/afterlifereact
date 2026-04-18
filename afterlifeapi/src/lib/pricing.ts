

export const v_65537b = 1;
export const v_08c486 = 100;
export const v_d1e4d0 = 3.5; 

export function v_f00297(v_9b6134): number {
  if (!v_9b6134) return 0;
  return Math.ceil(v_9b6134.length / v_d1e4d0);
}

export function v_fbb58c(v_4317d1): { credits: number; tokens: number } {
  const v_ef86b6 =
    v_4317d1.actualTokens ??
    v_f00297(v_4317d1.userText) + v_f00297(v_4317d1.replyText ?? "");
  const v_e2c945 = Math.max(v_65537b, Math.ceil(v_ef86b6 / v_08c486));
  return { credits: v_e2c945, tokens: v_ef86b6 };
}
