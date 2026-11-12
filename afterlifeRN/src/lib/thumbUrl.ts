

const v_0b6b35 = /\/oth-path\/files\/\d+/;

export function v_b938fd(v_f71b56): string | undefined {
  if (!v_f71b56) return undefined;
  if (!v_0b6b35.test(v_f71b56)) return v_f71b56;

  if (/[?&]thumb=1(?:&|$)/.test(v_f71b56)) return v_f71b56;
  return v_f71b56.includes("?") ? `${v_f71b56}&thumb=1` : `${v_f71b56}?thumb=1`;
}
