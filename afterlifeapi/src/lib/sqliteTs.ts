

export function v_15ea73(v_3a5fef): number {
  const v_6fc191 = v_3a5fef.replace(" ", "T");
  const v_d799e2 = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v_6fc191) ? v_6fc191 : `${v_6fc191}Z`);
  return Number.isFinite(v_d799e2) ? v_d799e2 : 0;
}
