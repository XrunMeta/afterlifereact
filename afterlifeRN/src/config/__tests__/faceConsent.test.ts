import { v_a3ee19, v_565c6d } from '../faceConsent';

describe('faceConsent flag', () => {
  it('defaults to OFF (dev/preview/APK 전부 OFF)', () => {
    expect(v_a3ee19).toBe(false);
    expect(v_565c6d()).toBe(false);
  });
});
