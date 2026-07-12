

export const FACE_CONSENT_ENFORCED: boolean =
  process.env.EXPO_PUBLIC_FACE_CONSENT_ENFORCED === 'true';

export function isFaceConsentEnforced(): boolean {
  return FACE_CONSENT_ENFORCED;
}
