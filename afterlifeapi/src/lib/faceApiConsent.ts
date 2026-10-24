

import type { v_de0a25 } from "./env";
import { v_3ebe58 } from "./errors";

export function v_b94402(v_c9c489): boolean {
  return v_c9c489.FACE_API_CONSENT_CHECK !== "off";
}

export async function v_94652e(
  env: v_de0a25["Bindings"],
  v_43e90c,
  v_c7daf6,
): Promise<void> {
  if (!v_b94402(v_c9c489)) return;
  let v_b6d66b = false;
  try {
    const v_3ac7e7 = await v_c9c489.DB.prepare(`SELECT face_biometric_consent AS fbc FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ fbc: number }>();
    v_b6d66b = !!v_3ac7e7 && v_3ac7e7.fbc === 1;
  } catch (v_9e86fd) {
    v_b6d66b = false; 
    console.error(`[face-consent] lookup failed userId=${v_43e90c} route=${v_c7daf6} err=${(v_9e86fd as Error).message}`);
  }
  if (!v_b6d66b) {

    console.warn(`[face-consent] denied userId=${v_43e90c} route=${v_c7daf6}`);
    throw new v_3ebe58("FACE_CONSENT_REQUIRED", "얼굴 인식 동의가 필요합니다.");
  }
}
