

export function v_417fc7(v_779914, v_148ff6): number {
  const v_35f85c = v_779914.length;
  const v_f4e98d = v_148ff6.length;
  if (v_35f85c === 0) return v_f4e98d;
  if (v_f4e98d === 0) return v_35f85c;
  let v_ba2215 = new Array<number>(v_f4e98d + 1);
  for (let v_b75e36 = 0; v_b75e36 <= v_f4e98d; v_b75e36++) v_ba2215[v_b75e36] = v_b75e36;
  for (let v_ebec57 = 1; v_ebec57 <= v_35f85c; v_ebec57++) {
    const v_c3bc75 = new Array<number>(v_f4e98d + 1);
    v_c3bc75[0] = v_ebec57;
    for (let v_b75e36 = 1; v_b75e36 <= v_f4e98d; v_b75e36++) {
      const v_4bf933 = v_779914[v_ebec57 - 1] === v_148ff6[v_b75e36 - 1] ? 0 : 1;
      v_c3bc75[v_b75e36] = Math.min(v_ba2215[v_b75e36]! + 1, v_c3bc75[v_b75e36 - 1]! + 1, v_ba2215[v_b75e36 - 1]! + v_4bf933);
    }
    v_ba2215 = v_c3bc75;
  }
  return v_ba2215[v_f4e98d]!;
}

export function v_e0041f(v_7c5791, v_5f5d6d): number {
  const v_ab6401 = (v_7c5791 ?? "").toLowerCase().trim();
  const v_8d41d7 = (v_5f5d6d ?? "").toLowerCase().trim();
  if (!v_ab6401 || !v_8d41d7) return 0;
  if (v_8d41d7.includes(v_ab6401) || v_ab6401.includes(v_8d41d7)) return 1;
  const v_80396f = (v_779914, v_148ff6): number => {
    const v_bb387f = Math.max(v_779914.length, v_148ff6.length);
    return v_bb387f === 0 ? 0 : 1 - v_417fc7(v_779914, v_148ff6) / v_bb387f;
  };
  let v_643757 = v_80396f(v_ab6401, v_8d41d7);
  for (const v_ea333d of v_8d41d7.split(/\s+/)) {
    if (v_ea333d) v_643757 = Math.max(v_643757, v_80396f(v_ab6401, v_ea333d));
  }
  return v_643757;
}

export const v_cfdcb0 = 0.7;
