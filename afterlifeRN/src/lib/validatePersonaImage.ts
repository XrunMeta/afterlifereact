

import { Image } from "react-native";
import FaceDetection from "@react-native-ml-kit/face-detection";

export type ValidationReason =
  | "no_face"
  | "too_small"
  | "too_large"
  | "off_center";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason };

const MIN_FACE_RATIO = 0.20;
const MAX_FACE_RATIO = 0.42;
const CY_MIN = 0.13;
const CY_MAX = 0.65;
const CX_MIN = 0.35;
const CX_MAX = 0.65;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err),
    );
  });
}

export async function validatePersonaImage(uri: string): Promise<ValidationResult> {
  try {
    const { width, height } = await getImageSize(uri);

    console.log("[validatePersonaImage] START", { uri: uri.slice(-40), width, height });
    const faces = await FaceDetection.detect(uri, {
      performanceMode: "accurate",
      landmarkMode: "none",
      contourMode: "none",
      classificationMode: "none",
      minFaceSize: 0.15,
    });

    console.log("[validatePersonaImage] detect done, faces =", faces?.length ?? "null");
    if (!faces || faces.length === 0) return { ok: false, reason: "no_face" };

    const primary = faces.reduce((a, b) => {
      const aArea = a.frame.width * a.frame.height;
      const bArea = b.frame.width * b.frame.height;
      return aArea >= bArea ? a : b;
    });
    const fw = primary.frame.width;
    const fh = primary.frame.height;
    const faceLong = Math.max(fw, fh);
    const imgLong = Math.max(width, height);
    const ratio = imgLong > 0 ? faceLong / imgLong : 0;
    const cx = (primary.frame.left + fw / 2) / width;
    const cy = (primary.frame.top + fh / 2) / height;

    console.log("[validatePersonaImage] metrics", { ratio, cx, cy, fw, fh });
    if (ratio < MIN_FACE_RATIO) return { ok: false, reason: "too_small" };
    if (ratio > MAX_FACE_RATIO) return { ok: false, reason: "too_large" };
    if (cy < CY_MIN || cy > CY_MAX) return { ok: false, reason: "off_center" };
    if (cx < CX_MIN || cx > CX_MAX) return { ok: false, reason: "off_center" };
    return { ok: true };
  } catch (err) {

    console.warn("[validatePersonaImage] FAIL-OPEN (native missing?):", err);
    return { ok: true };
  }
}

export function validationReasonKey(reason: ValidationReason): string {
  switch (reason) {
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
