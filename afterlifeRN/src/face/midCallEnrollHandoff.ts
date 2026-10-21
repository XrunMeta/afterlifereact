

export type MidCallEnrollResult = {
  cloneId: number;
  personId: number;
  displayName: string;
};

let v_483de2 = null;

export function v_ff0340(v_43c42e): void {
  v_483de2 = v_43c42e;
}

export function v_df5c39(v_6e0fd3): MidCallEnrollResult | null {
  const v_43c42e = v_483de2;
  v_483de2 = null;
  return v_43c42e && v_43c42e.cloneId === v_6e0fd3 ? v_43c42e : null;
}
