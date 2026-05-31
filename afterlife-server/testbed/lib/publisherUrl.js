

export function v_9adef9(v_497c1d, v_bd5a53) {
  const v_e2a85c = Number(v_497c1d);
  if (!Number.isInteger(v_e2a85c) || v_e2a85c < 1 || v_e2a85c > 65535) return v_bd5a53;
  return `http://127.0.0.1:${v_e2a85c}`;
}
