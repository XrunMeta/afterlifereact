import {
  v_1c4418,
  v_9100c8,
  v_81b6e2,
  v_b0d8db,
  v_c57813,
} from '../faceConsentError';

describe('isFaceConsentRequiredError', () => {
  test('403 + FACE_CONSENT_REQUIRED 만 true', () => {
    expect(v_1c4418({ status: 403, code: 'FACE_CONSENT_REQUIRED' })).toBe(true);
  });
  test('다른 403 코드·다른 status·비객체는 false', () => {
    expect(v_1c4418({ status: 403, code: 'FORBIDDEN' })).toBe(false);
    expect(v_1c4418({ status: 401, code: 'FACE_CONSENT_REQUIRED' })).toBe(false);
    expect(v_1c4418(new Error('x'))).toBe(false);
    expect(v_1c4418(null)).toBe(false);
    expect(v_1c4418('FACE_CONSENT_REQUIRED')).toBe(false);
  });
  test('status/code 형', () => {
    expect(v_9100c8(403, 'FACE_CONSENT_REQUIRED')).toBe(true);
    expect(v_9100c8(500, 'FACE_CONSENT_REQUIRED')).toBe(false);
    expect(v_9100c8(403, undefined)).toBe(false);
  });
});

describe('shouldRevokeFaceConsent', () => {
  test('동의 켜진 통화는 전환', () => {
    expect(v_81b6e2({ faceBiometricConsent: true, consentGranted: true })).toBe(true);
  });
  test('조회 중(null)이어도 전환', () => {
    expect(v_81b6e2({ faceBiometricConsent: null, consentGranted: false })).toBe(true);
  });
  test('이미 둘 다 꺼졌으면 no-op', () => {
    expect(v_81b6e2({ faceBiometricConsent: false, consentGranted: false })).toBe(false);
  });
});

describe('subscribe / notify', () => {
  test('구독자 호출·해제·예외 격리', () => {
    const v_b785c9 = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const v_779914 = jest.fn();
    const v_0af197 = jest.fn(() => {
      throw new Error('boom');
    });
    const v_8dda66 = v_b0d8db(v_779914);
    const v_a9df87 = v_b0d8db(v_0af197);
    v_c57813();
    expect(v_779914).toHaveBeenCalledTimes(1);
    expect(v_0af197).toHaveBeenCalledTimes(1);
    v_8dda66();
    v_a9df87();
    v_c57813();
    expect(v_779914).toHaveBeenCalledTimes(1);
    v_b785c9.mockRestore();
  });
});
