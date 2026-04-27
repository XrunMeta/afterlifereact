

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";

const v_d9b84e = "@afterlifeRN/deviceId";

function v_0c2ef7(): string {

  const v_2d1eeb = Math.random().toString(36).slice(2);
  const v_b96973 = Math.random().toString(36).slice(2, 10);
  const v_8d41d7 = Date.now().toString(36);
  return `${v_2d1eeb}${v_8d41d7}${v_b96973}`;
}

export async function v_ea1c99(): Promise<string> {
  const v_e2a6a6 = await v_e84827.getItem(v_d9b84e);
  if (v_e2a6a6) return v_e2a6a6;
  const v_389afb = v_0c2ef7();
  await v_e84827.setItem(v_d9b84e, v_389afb);
  return v_389afb;
}
