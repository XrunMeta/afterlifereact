import { FACE_CONSENT_ENFORCED, isFaceConsentEnforced } from '../faceConsent';

describe('faceConsent flag', () => {
  it('defaults to OFF (dev/preview/APK 전부 OFF)', () => {
    expect(FACE_CONSENT_ENFORCED).toBe(false);
    expect(isFaceConsentEnforced()).toBe(false);
  });
});
