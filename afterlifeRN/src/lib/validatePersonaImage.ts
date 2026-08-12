

import { v_cf9c33 } from "rcmrninabrnb";
import v_283009 from "tqfwpajvwzisfnophfklndhmbxhydolxisx";

export type ValidationReason =
  | "no_face"
  | "too_small"
  | "too_large"
  | "off_center";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason };

const v_6a5345 = 0.20;
const v_822ad2 = 0.42;
const v_cf2aaf = 0.13;
const v_79db15 = 0.65;
const v_0e7d10 = 0.35;
const v_25c159 = 0.65;

function v_333679(v_cd1446): Promise<{ width: number; height: number }> {
  return new Promise((v_6f7712, v_bad6f3) => {
    v_cf9c33.getSize(
      v_cd1446,
      (v_8e4fb6, v_c86e33) => v_6f7712({ width: v_8e4fb6, height: v_c86e33 }),
      (v_49263d) => v_bad6f3(v_49263d),
    );
  });
}

export async function v_9139dc(v_cd1446): Promise<ValidationResult> {
  try {
    const { width: v_8e4fb6, height: v_c86e33 } = await v_333679(v_cd1446);

    console.log("[validatePersonaImage] START", { uri: v_cd1446.slice(-40), width: v_8e4fb6, height: v_c86e33 });
    const v_a51d09 = await v_283009.detect(v_cd1446, {
      performanceMode: "accurate",
      landmarkMode: "none",
      contourMode: "none",
      classificationMode: "none",
      minFaceSize: 0.15,
    });

    console.log("[validatePersonaImage] detect done, faces =", v_a51d09?.length ?? "null");
    if (!v_a51d09 || v_a51d09.length === 0) return { ok: false, reason: "no_face" };

    const v_127e92 = v_a51d09.reduce((v_779914, v_148ff6) => {
      const v_601fab = v_779914.frame.width * v_779914.frame.height;
      const v_7d1a7f = v_148ff6.frame.width * v_148ff6.frame.height;
      return v_601fab >= v_7d1a7f ? v_779914 : v_148ff6;
    });
    const v_754d3a = v_127e92.frame.width;
    const v_80ac06 = v_127e92.frame.height;
    const v_cecddc = Math.max(v_754d3a, v_80ac06);
    const v_58b636 = Math.max(v_8e4fb6, v_c86e33);
    const v_80396f = v_58b636 > 0 ? v_cecddc / v_58b636 : 0;
    const v_4148d9 = (v_127e92.frame.left + v_754d3a / 2) / v_8e4fb6;
    const v_85ddfd = (v_127e92.frame.top + v_80ac06 / 2) / v_c86e33;

    console.log("[validatePersonaImage] metrics", { ratio: v_80396f, cx: v_4148d9, cy: v_85ddfd, fw: v_754d3a, fh: v_80ac06 });
    if (v_80396f < v_6a5345) return { ok: false, reason: "too_small" };
    if (v_80396f > v_822ad2) return { ok: false, reason: "too_large" };
    if (v_85ddfd < v_cf2aaf || v_85ddfd > v_79db15) return { ok: false, reason: "off_center" };
    if (v_4148d9 < v_0e7d10 || v_4148d9 > v_25c159) return { ok: false, reason: "off_center" };
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
  }
}
