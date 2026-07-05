

import { saveCallLearningConsent, getCallLearningConsent } from '../../src/api/consent';

jest.mock('../../src/lib/authFetch', () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from '../../src/lib/authFetch';
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const ACCESS_TOKEN = 'test-access-token';

beforeEach(() => {
  mockAuthFetch.mockReset();
});

describe('saveCallLearningConsent', () => {
  it('POST /oth-path 를 state·옵션과 함께 호출', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, state: 'granted' });

    const r = await saveCallLearningConsent(ACCESS_TOKEN, 'granted', { channel: 'settings' });

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.state).toBe('granted');
    expect(body.channel).toBe('settings');

    expect(r.state).toBe('granted');
  });

  it('revoked 상태도 올바르게 전송한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, state: 'revoked' });

    await saveCallLearningConsent(ACCESS_TOKEN, 'revoked');

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.state).toBe('revoked');
  });

  it('channel/termsVersion 없이 호출하면 body 에 포함되지 않는다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, state: 'granted' });

    await saveCallLearningConsent(ACCESS_TOKEN, 'granted');

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('channel');
    expect(body).not.toHaveProperty('termsVersion');
  });

  it('termsVersion 을 넘기면 body 에 포함된다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, state: 'granted' });

    await saveCallLearningConsent(ACCESS_TOKEN, 'granted', { termsVersion: '1.0.0', channel: 'signup' });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.termsVersion).toBe('1.0.0');
    expect(body.channel).toBe('signup');
  });
});

describe('getCallLearningConsent', () => {
  it('GET /oth-path 의 call_learning.state 반환', async () => {
    mockAuthFetch.mockResolvedValueOnce({ call_learning: { state: 'granted', at: 1 } });

    const s = await getCallLearningConsent(ACCESS_TOKEN);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('GET');

    expect(s).toBe('granted');
  });

  it('none 상태도 그대로 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ call_learning: { state: 'none', at: null } });

    const s = await getCallLearningConsent(ACCESS_TOKEN);

    expect(s).toBe('none');
  });
});
