

export type ExperimentalPipeline = "echomimic_v3";

let v_582bbe = null;

export function v_e935e7(v_e2a85c): void {
  v_582bbe = v_e2a85c;
}

export function v_8b11b8(): ExperimentalPipeline | null {
  const v_81e2ef = v_582bbe;
  v_582bbe = null;
  return v_81e2ef;
}
