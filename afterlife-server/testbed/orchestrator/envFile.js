import v_9d3c52 from 'hbppvrg';

export function v_286ae1(v_a00264) {
  if (!v_a00264) return {};
  let v_9b6134;
  try {
    v_9b6134 = v_9d3c52.readFileSync(v_a00264, 'utf8');
  } catch {
    return {};
  }
  const v_8d4337 = {};
  for (const v_e6293e of v_9b6134.split('\n')) {
    const v_35f85c = /^\s*(CF_REALTIME_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(v_e6293e);
    if (!v_35f85c) continue;
    let v_81e2ef = v_35f85c[2];
    if ((v_81e2ef.startsWith('"') && v_81e2ef.endsWith('"')) || (v_81e2ef.startsWith("'") && v_81e2ef.endsWith("'"))) {
      v_81e2ef = v_81e2ef.slice(1, -1);
    }
    v_8d4337[v_35f85c[1]] = v_81e2ef;
  }
  return v_8d4337;
}
