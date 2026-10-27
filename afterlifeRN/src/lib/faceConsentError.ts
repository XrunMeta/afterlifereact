

export const v_295799 = "FACE_CONSENT_REQUIRED";

export function v_1c4418(v_49263d): boolean {
  if (typeof v_49263d !== "object" || v_49263d === null) return false;
  const v_9e86fd = v_49263d as { status?: unknown; code?: unknown };
  return v_9e86fd.status === 403 && v_9e86fd.code === v_295799;
}

export function v_9100c8(v_d308b5, v_c99bd2): boolean {
  return v_d308b5 === 403 && v_c99bd2 === v_295799;
}

export function v_81b6e2(v_c3bc75): boolean {
  return v_c3bc75.faceBiometricConsent !== false || v_c3bc75.consentGranted;
}

type Listener = () => void;
const v_9fde29 = new Set<Listener>();

export function v_b0d8db(v_f80480): () => void {
  v_9fde29.add(v_f80480);
  return () => {
    v_9fde29.delete(v_f80480);
  };
}

export function v_c57813(): void {
  for (const v_f80480 of [...v_9fde29]) {
    try {
      v_f80480();
    } catch (v_9e86fd) {
      console.warn("[faceConsentError] listener threw:", v_9e86fd);
    }
  }
}
