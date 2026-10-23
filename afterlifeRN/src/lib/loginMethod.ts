

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import type { v_59e01e } from "./appsFlyer";

const v_d9b84e = "@afterlifeRN/auth/loginMethod";

export function v_680cc9(method: v_59e01e): void {
  v_e84827.setItem(v_d9b84e, v_bfe9b9).catch(() => {});
}

export async function v_8cf39a(): Promise<v_59e01e | null> {
  try {
    const v_81e2ef = await v_e84827.getItem(v_d9b84e);
    return v_81e2ef === "email" || v_81e2ef === "email_otp" || v_81e2ef === "google" || v_81e2ef === "apple" ? v_81e2ef : null;
  } catch {
    return null;
  }
}
