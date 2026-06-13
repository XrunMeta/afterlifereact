

import { createPerson, saveFaceConsent, listPersons } from '../../src/api/persons';

jest.mock('../../src/lib/authFetch', () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from '../../src/lib/authFetch';
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const ACCESS_TOKEN = 'test-access-token';

beforeEach(() => {
  mockAuthFetch.mockReset();
});

describe('createPerson', () => {
  it('POST /oth-path 를 호출하고 {id, consentState} 를 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 42, consentState: 'none' });

    const result = await createPerson(ACCESS_TOKEN);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('POST');

    expect(result).toEqual({ id: 42, consentState: 'none' });
  });

  it('cloneId 를 넘기면 body 에 포함된다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 7, consentState: 'none' });

    await createPerson(ACCESS_TOKEN, { cloneId: 99 });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.cloneId).toBe(99);
  });

  it('cloneId 없이 호출해도 body 에 cloneId 가 포함되지 않는다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 1, consentState: 'none' });

    await createPerson(ACCESS_TOKEN);

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('cloneId');
  });
});

describe('saveFaceConsent', () => {
  it('POST /oth-path 를 호출하고 consentState 를 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ consentState: 'granted' });

    const result = await saveFaceConsent(ACCESS_TOKEN, 42, 'granted');

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.state).toBe('granted');

    expect(result).toBe('granted');
  });

  it('revoked 상태도 올바르게 전송한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ consentState: 'revoked' });

    await saveFaceConsent(ACCESS_TOKEN, 5, 'revoked');

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.state).toBe('revoked');
  });

  it('termsVersion 을 넘기면 body 에 포함된다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ consentState: 'granted' });

    await saveFaceConsent(ACCESS_TOKEN, 42, 'granted', { termsVersion: '1.0.0' });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.termsVersion).toBe('1.0.0');
  });

  it('termsVersion 없이 호출하면 body 에 termsVersion 이 없다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ consentState: 'granted' });

    await saveFaceConsent(ACCESS_TOKEN, 42, 'granted');

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('termsVersion');
  });
});

describe('listPersons', () => {
  it('GET /oth-path 를 호출하고 items 배열을 반환한다', async () => {
    const mockItems = [
      { id: 1, consentState: 'granted', cloneId: 10 },
      { id: 2, consentState: 'none', cloneId: null },
    ];
    mockAuthFetch.mockResolvedValueOnce({ data: mockItems });

    const result = await listPersons(ACCESS_TOKEN);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('GET');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(1);
  });
});
