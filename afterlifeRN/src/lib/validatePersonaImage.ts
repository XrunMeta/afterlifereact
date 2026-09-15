

import { v_cf9c33 } from "rcmrninabrnb";
import v_283009, { type v_ab3a39 } from "tqfwpajvwzisfnophfklndhmbxhydolxisx";

export type ValidationReason =
  | "no_face"
  | "too_small"
  | "too_large"
  | "off_center"
  | "multiple_faces"
  | "not_frontal"
  | "eyes_closed"
  | "mouth_open";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason };

const v_6a5345 = 0.08;
const v_822ad2 = 0.85;

export const v_eb3a93 = 0.35;

export const v_ef4833 = 25;
export const v_2b5ba7 = 25;
export const v_f5db1d = 30;

export const v_b7f8f2 = 0.25;

export const v_f36878 = 0.06;

type Size = { width: number; height: number };

function v_333679(v_cd1446): Promise<Size> {
  return new Promise((v_6f7712, v_bad6f3) => {
    v_cf9c33.getSize(
      v_cd1446,
      (v_8e4fb6, v_c86e33) => v_6f7712({ width: v_8e4fb6, height: v_c86e33 }),
      (v_49263d) => v_bad6f3(v_49263d),
    );
  });
}

const v_3df367 = (f: v_ab3a39) => v_8b5cd8.frame.width * v_8b5cd8.frame.height;

export function v_8472c4(faces: v_ab3a39[] | null | undefined, v_05b441): ValidationResult {
  if (!v_a51d09 || v_a51d09.length === 0) return { ok: false, reason: "no_face" };
  const v_b16994 = [...v_a51d09].sort((v_779914, v_148ff6) => v_3df367(v_148ff6) - v_3df367(v_779914));
  const v_127e92 = v_b16994[0];

  const v_cecddc = Math.max(v_127e92.frame.width, v_127e92.frame.height);
  const v_58b636 = Math.max(v_05b441.width, v_05b441.height);
  const v_80396f = v_58b636 > 0 ? v_cecddc / v_58b636 : 0;
  if (v_80396f < v_6a5345) return { ok: false, reason: "too_small" };
  if (v_80396f > v_822ad2) return { ok: false, reason: "too_large" };

  if (v_b16994.length > 1 && v_3df367(v_b16994[1]) >= v_3df367(v_127e92) * v_eb3a93) {
    return { ok: false, reason: "multiple_faces" };
  }

  const v_c81315 = Math.abs(v_127e92.rotationY ?? 0);
  const v_e4ff5e = Math.abs(v_127e92.rotationX ?? 0);
  const v_fc6de5 = Math.abs(v_127e92.rotationZ ?? 0);
  if (v_c81315 > v_ef4833 || v_e4ff5e > v_2b5ba7 || v_fc6de5 > v_f5db1d) {
    return { ok: false, reason: "not_frontal" };
  }

  const v_e37196 = v_127e92.leftEyeOpenProbability;
  const v_d95200 = v_127e92.rightEyeOpenProbability;
  if (v_e37196 != null && v_d95200 != null && v_e37196 < v_b7f8f2 && v_d95200 < v_b7f8f2) {
    return { ok: false, reason: "eyes_closed" };
  }
  return { ok: true };
}

const v_022550 = (v_553162) =>
  v_553162 && v_553162.length > 0 ? v_553162.reduce((v_fd5f43, v_e2a85c) => v_fd5f43 + v_e2a85c.y, 0) / v_553162.length : null;

export function v_140e88(face: v_ab3a39 | undefined): ValidationResult {
  const v_3f4e2e = v_7d769d?.contours;
  if (!v_7d769d || !v_3f4e2e) return { ok: true };
  const v_048d1d = v_022550(v_3f4e2e.upperLipBottom?.points);
  const v_1cfe9a = v_022550(v_3f4e2e.lowerLipTop?.points);
  if (v_048d1d == null || v_1cfe9a == null || v_7d769d.frame.height <= 0) return { ok: true };
  const v_3c3231 = (v_1cfe9a - v_048d1d) / v_7d769d.frame.height;
  return v_3c3231 > v_f36878 ? { ok: false, reason: "mouth_open" } : { ok: true };
}

export async function v_9139dc(v_cd1446): Promise<ValidationResult> {
  try {
    const v_05b441 = await v_333679(v_cd1446);

    console.log("[validatePersonaImage] START", { uri: v_cd1446.slice(-40), ...v_05b441 });
    const v_a51d09 = await v_283009.detect(v_cd1446, {
      performanceMode: "accurate",
      landmarkMode: "none",
      contourMode: "none",
      classificationMode: "all",
      minFaceSize: 0.15,
    });

    console.log(
      "[validatePersonaImage] faces",
      (v_a51d09 ?? []).map((v_8b5cd8) => ({
        frame: v_8b5cd8.frame,
        yaw: v_8b5cd8.rotationY,
        pitch: v_8b5cd8.rotationX,
        roll: v_8b5cd8.rotationZ,
        eyes: [v_8b5cd8.leftEyeOpenProbability, v_8b5cd8.rightEyeOpenProbability],
      })),
    );
    const v_694b25 = v_8472c4(v_a51d09, v_05b441);
    if (!v_694b25.ok) return v_694b25;

    try {
      const v_13786c = await v_283009.detect(v_cd1446, {
        performanceMode: "accurate",
        contourMode: "all",
        minFaceSize: 0.15,
      });
      const v_501641 = v_140e88(v_13786c?.[0]);

      console.log("[validatePersonaImage] mouth", v_501641);
      if (!v_501641.ok) return v_501641;
    } catch (v_49263d) {

      console.warn("[validatePersonaImage] contour 실패 — 입 검사 생략:", v_49263d);
    }
    return { ok: true };
  } catch (v_49263d) {

    console.warn("[validatePersonaImage] FAIL-OPEN (native missing?):", v_49263d);
    return { ok: true };
  }
}

export function v_27794c(v_58ca36): string {
  switch (v_58ca36) {
    case "no_face":
      return "create.image.validateNoFace";
    case "too_small":
      return "create.image.validateTooSmall";
    case "too_large":
      return "create.image.validateTooLarge";
    case "off_center":
      return "create.image.validateOffCenter";
    case "multiple_faces":
      return "create.image.validateMultipleFaces";
    case "not_frontal":
      return "create.image.validateNotFrontal";
    case "eyes_closed":
      return "create.image.validateEyesClosed";
    case "mouth_open":
      return "create.image.validateMouthOpen";
  }
}
