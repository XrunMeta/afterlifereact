

import {
  v_7f847d, v_b14b3b,
  v_421733, v_0f8436,
} from '../../src/api/consent';

jest.mock('../../src/lib/authFetch', () => ({
  authFetch: jest.fn(),
}));

import { v_04b58a } from '../../src/lib/authFetch';
const v_09509b = v_04b58a as jest.MockedFunction<typeof v_04b58a>;

const v_4ac7fe = 'test-access-token';

beforeEach(() => {
  v_09509b.mockReset();
});

describe('saveCallLearningConsent', () => {
  it('POST /oth-path 를 state·옵션과 함께 호출', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'granted' });

    const v_cb35cb = await v_7f847d(v_4ac7fe, 'granted', { channel: 'settings' });

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.state).toBe('granted');
    expect(v_4d33b2.channel).toBe('settings');

    expect(v_cb35cb.state).toBe('granted');
  });

  it('revoked 상태도 올바르게 전송한다', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'revoked' });

    await v_7f847d(v_4ac7fe, 'revoked');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.state).toBe('revoked');
  });

  it('channel/termsVersion 없이 호출하면 body 에 포함되지 않는다', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'granted' });

    await v_7f847d(v_4ac7fe, 'granted');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).not.toHaveProperty('channel');
    expect(v_4d33b2).not.toHaveProperty('termsVersion');
  });

  it('termsVersion 을 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'granted' });

    await v_7f847d(v_4ac7fe, 'granted', { termsVersion: '1.0.0', channel: 'signup' });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.termsVersion).toBe('1.0.0');
    expect(v_4d33b2.channel).toBe('signup');
  });
});

describe('getCallLearningConsent', () => {
  it('GET /oth-path 의 call_learning.state 반환', async () => {
    v_09509b.mockResolvedValueOnce({ call_learning: { state: 'granted', at: 1 } });

    const v_fd5f43 = await v_b14b3b(v_4ac7fe);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('GET');

    expect(v_fd5f43).toBe('granted');
  });

  it('none 상태도 그대로 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ call_learning: { state: 'none', at: null } });

    const v_fd5f43 = await v_b14b3b(v_4ac7fe);

    expect(v_fd5f43).toBe('none');
  });
});

describe('saveFaceBiometricConsent', () => {
  it('POST /oth-path 를 state·옵션과 함께 호출', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'granted' });

    const v_cb35cb = await v_421733(v_4ac7fe, 'granted', { termsVersion: 'v1', channel: 'signup' });

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.state).toBe('granted');
    expect(v_4d33b2.termsVersion).toBe('v1');
    expect(v_4d33b2.channel).toBe('signup');
    expect(v_cb35cb.state).toBe('granted');
  });

  it('옵션 없이 호출하면 body 에 state 만 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ ok: true, state: 'revoked' });

    await v_421733(v_4ac7fe, 'revoked');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).not.toHaveProperty('termsVersion');
    expect(v_4d33b2).not.toHaveProperty('channel');
  });
});

describe('getFaceBiometricConsent', () => {
  it('GET /oth-path 의 face_biometric 필드 반환', async () => {
    v_09509b.mockResolvedValueOnce({
      call_learning: { state: 'none', at: null },
      face_biometric: { state: 'granted', at: 123, version: 'v1' },
    });

    const v_cb35cb = await v_0f8436(v_4ac7fe);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_00cfc6.method).toBe('GET');
    expect(v_cb35cb).toEqual({ state: 'granted', at: 123, version: 'v1' });
  });

  it('미동의 상태 {state:"none", version:null} 도 그대로 반환', async () => {
    v_09509b.mockResolvedValueOnce({
      call_learning: { state: 'none', at: null },
      face_biometric: { state: 'none', at: null, version: null },
    });

    const v_cb35cb = await v_0f8436(v_4ac7fe);
    expect(v_cb35cb).toEqual({ state: 'none', at: null, version: null });
  });
});
