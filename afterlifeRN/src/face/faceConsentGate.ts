

export function v_0b124e(v_b6e533): boolean {
  return v_b6e533 === "granted";
}

export function v_822c19(v_74e200): v_74e200 is boolean {
  return typeof v_74e200 === "boolean";
}

export function v_fd304e(v_74e200): boolean {
  return v_74e200 === true;
}

export function v_50b48d(v_74e200): boolean {
  return v_74e200 === true;
}

export function v_41cb05(
  v_74e200,
): { face_consent: boolean } | Record<string, never> {
  return v_822c19(v_74e200) ? { face_consent: v_74e200 } : {};
}

export function v_96e195(
  v_74e200,
): { type: "face_consent"; granted: boolean } | null {
  return v_822c19(v_74e200) ? { type: "face_consent", granted: v_74e200 } : null;
}

export function v_8c3a7c(
  v_97d2e9,
): { type: "turn_face"; verdict: "no_consent"; who: "self" | "other" | null } {
  return { type: "turn_face", verdict: "no_consent", who: v_97d2e9 ?? null };
}

export function v_2cac55(
  v_74e200,
  v_97d2e9,
): boolean {
  return v_74e200 === false && !!v_97d2e9;
}

export async function v_9ff376(
  v_bcfa0f,
): Promise<boolean> {
  try {
    const v_cb35cb = await v_bcfa0f();
    return v_0b124e(v_cb35cb?.state);
  } catch {
    return false;
  }
}

export function v_b7658e(
  v_74e200,
  v_9b6134,
  v_33a406,
  send: ((v_97d2e9) => void) | undefined,
): "self" | "other" | null {
  const v_97d2e9 = v_33a406(v_9b6134);
  if (!v_2cac55(v_74e200, v_97d2e9)) return null;
  v_9c423d?.(v_97d2e9);
  return v_97d2e9;
}
