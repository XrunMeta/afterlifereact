

import { v_4e7b87, v_31967f, v_865d38 } from '../../src/api/persons';

jest.mock('../../src/lib/authFetch', () => ({
  authFetch: jest.fn(),
}));

import { v_04b58a } from '../../src/lib/authFetch';
const v_09509b = v_04b58a as jest.MockedFunction<typeof v_04b58a>;

const v_4ac7fe = 'test-access-token';

beforeEach(() => {
  v_09509b.mockReset();
});

describe('createPerson', () => {
  it('POST /oth-path 를 호출하고 {id, consentState} 를 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ id: 42, consentState: 'pending' });

    const v_43c42e = await v_4e7b87(v_4ac7fe);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    expect(v_43c42e).toEqual({ id: 42, consentState: 'pending' });
  });

  it('cloneId 를 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ id: 7, consentState: 'pending' });

    await v_4e7b87(v_4ac7fe, { cloneId: 99 });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.cloneId).toBe(99);
  });

  it('cloneId 없이 호출해도 body 에 cloneId 가 포함되지 않는다', async () => {
    v_09509b.mockResolvedValueOnce({ id: 1, consentState: 'pending' });

    await v_4e7b87(v_4ac7fe);

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).not.toHaveProperty('cloneId');
  });
});

describe('saveFaceConsent', () => {
  it('POST /oth-path 를 호출하고 consentState 를 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ consentState: 'granted' });

    const v_43c42e = await v_31967f(v_4ac7fe, 42, 'granted');

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.state).toBe('granted');

    expect(v_43c42e).toBe('granted');
  });

  it('revoked 상태도 올바르게 전송한다', async () => {
    v_09509b.mockResolvedValueOnce({ consentState: 'revoked' });

    await v_31967f(v_4ac7fe, 5, 'revoked');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.state).toBe('revoked');
  });

  it('termsVersion 을 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ consentState: 'granted' });

    await v_31967f(v_4ac7fe, 42, 'granted', { termsVersion: '1.0.0' });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.termsVersion).toBe('1.0.0');
  });

  it('termsVersion 없이 호출하면 body 에 termsVersion 이 없다', async () => {
    v_09509b.mockResolvedValueOnce({ consentState: 'granted' });

    await v_31967f(v_4ac7fe, 42, 'granted');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).not.toHaveProperty('termsVersion');
  });
});

describe('listPersons', () => {
  it('GET /oth-path 를 호출하고 items 배열을 반환한다', async () => {
    const v_473741 = [
      { id: 1, consentState: 'granted', cloneId: 10 },
      { id: 2, consentState: 'pending', cloneId: null },
    ];
    v_09509b.mockResolvedValueOnce({ items: v_473741 });

    const v_43c42e = await v_865d38(v_4ac7fe);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('GET');

    expect(v_43c42e.items).toHaveLength(2);
    expect(v_43c42e.items[0].id).toBe(1);
  });
});
