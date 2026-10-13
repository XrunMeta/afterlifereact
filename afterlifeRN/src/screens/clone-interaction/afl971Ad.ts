
export function v_8e0f80(v_5a1787, v_0a712d): boolean {
  const v_3e45d6 = v_0a712d ? 2 : 10;
  const v_364721 = v_0a712d ? 1 : 5;
  return v_5a1787 === v_3e45d6 || (v_5a1787 > v_3e45d6 && (v_5a1787 - v_3e45d6) % v_364721 === 0);
}

const v_9474af = new Set<string>([
  "oth-user@example.invalid",
  "oth-test@example.invalid",
]);
export function v_25c9bd(v_e0c7e8): boolean {
  return !!v_e0c7e8 && v_9474af.has(v_e0c7e8);
}
