

export function v_f22ce9(
  v_9b6134,
  say: (v_9b6134) => Promise<void> | void,
  v_43d2ef,
): void {
  const v_2f361a = v_9b6134.trim();
  if (!v_2f361a) return; 

  Promise.resolve(v_3e2c87(v_2f361a)).catch(() => {});
  v_43d2ef(""); 
}
