

export function v_a64bce(v_81e2ef): number[] {
  let v_f998cc = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_81e2ef.length; v_ebec57++) v_f998cc += v_81e2ef[v_ebec57] * v_81e2ef[v_ebec57];
  const v_825625 = Math.sqrt(v_f998cc);
  if (v_825625 === 0) return Array.from(v_81e2ef);
  const v_8d4337 = new Array<number>(v_81e2ef.length);
  for (let v_ebec57 = 0; v_ebec57 < v_81e2ef.length; v_ebec57++) v_8d4337[v_ebec57] = v_81e2ef[v_ebec57] / v_825625;
  return v_8d4337;
}
