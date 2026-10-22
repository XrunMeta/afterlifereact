

export type MidCallEnrollResult = {
  cloneId: number;
  personId: number;
  displayName: string;
};

let v_483de2 = null;

let v_f1b34e = null;

export function v_b42f19(v_6e0fd3, v_f94e64): void {
  v_f1b34e = { cloneId: v_6e0fd3, vectors: v_f94e64 };
}

export function v_790867(v_6e0fd3): number[][] | null {
  const v_81e2ef = v_f1b34e;
  v_f1b34e = null;
  return v_81e2ef && v_81e2ef.cloneId === v_6e0fd3 && v_81e2ef.vectors.length > 0 ? v_81e2ef.vectors : null;
}

export function v_ff0340(v_43c42e): void {
  v_483de2 = v_43c42e;
}

export function v_df5c39(v_6e0fd3): MidCallEnrollResult | null {
  const v_43c42e = v_483de2;
  v_483de2 = null;
  return v_43c42e && v_43c42e.cloneId === v_6e0fd3 ? v_43c42e : null;
}
