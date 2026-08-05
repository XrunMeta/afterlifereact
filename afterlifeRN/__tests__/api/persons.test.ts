

import {
  v_4e7b87,
  v_31967f,
  v_865d38,
  v_137542,
  v_238ce0,
  v_20bacb,
  v_a1ba62,
  v_c63c1d,
} from '../../src/api/persons';

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
    v_09509b.mockResolvedValueOnce({ id: 42, consentState: 'none' });

    const v_43c42e = await v_4e7b87(v_4ac7fe, { cloneId: 1 });

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    expect(v_43c42e).toEqual({ id: 42, consentState: 'none' });
  });

  it('cloneId 를 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ id: 7, consentState: 'none' });

    await v_4e7b87(v_4ac7fe, { cloneId: 99 });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.cloneId).toBe(99);
  });

  it('cloneId 는 항상 body 에 포함된다(person 은 클론 전속)', async () => {
    v_09509b.mockResolvedValueOnce({ id: 1, consentState: 'none' });

    await v_4e7b87(v_4ac7fe, { cloneId: 5 });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).toHaveProperty('cloneId', 5);
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
      { id: 2, consentState: 'none', cloneId: null },
    ];
    v_09509b.mockResolvedValueOnce({ data: v_473741 });

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

describe('updatePersonName', () => {
  it('PATCH /oth-path 를 displayName body와 함께 호출', async () => {
    v_09509b.mockResolvedValueOnce({ id: 42, displayName: '민지' });

    const v_43c42e = await v_137542(v_4ac7fe, 42, '민지');

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('PATCH');

    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.displayName).toBe('민지');
    expect(v_43c42e).toEqual({ id: 42, displayName: '민지' });
  });
});

describe('createPerson enrolledVia', () => {
  it('enrolledVia 를 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ id: 9, consentState: 'granted' });

    await v_4e7b87(v_4ac7fe, { cloneId: 1, enrolledVia: 'auto_biometric' });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.enrolledVia).toBe('auto_biometric');
  });

  it('enrolledVia 없이 호출하면 body 에 포함되지 않는다(회귀)', async () => {
    v_09509b.mockResolvedValueOnce({ id: 10, consentState: 'none' });

    await v_4e7b87(v_4ac7fe, { cloneId: 1 });

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2).not.toHaveProperty('enrolledVia');
  });
});

describe('selfConfirm', () => {
  it('POST /oth-path 을 vectors 와 함께 호출하고 {personId, selfPersonId} 를 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ personId: 11, selfPersonId: 11 });
    const v_f94e64 = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ];

    const v_43c42e = await v_238ce0(v_4ac7fe, 5, v_f94e64);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('POST');

    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.vectors).toEqual(v_f94e64);
    expect(v_4d33b2).not.toHaveProperty('displayName');

    expect(v_43c42e).toEqual({ personId: 11, selfPersonId: 11 });
  });

  it('displayName 을 넘기면 body 에 포함된다', async () => {
    v_09509b.mockResolvedValueOnce({ personId: 12, selfPersonId: 12 });

    await v_238ce0(v_4ac7fe, 5, [[1, 0], [1, 0], [1, 0]], '민지');

    const [, , v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const v_4d33b2 = JSON.parse(v_00cfc6.body as string) as Record<string, unknown>;
    expect(v_4d33b2.displayName).toBe('민지');
  });

  it('409(CONFLICT) 등 authFetch 실패는 그대로 전파한다(호출부가 분류)', async () => {
    v_09509b.mockRejectedValueOnce(new Error('CONFLICT'));

    await expect(v_238ce0(v_4ac7fe, 5, [[1], [1], [1]])).rejects.toThrow('CONFLICT');
  });
});

describe('fetchFacePolicy', () => {
  it('GET /oth-path 를 호출하고 faceIdentifyEnabled 를 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ faceIdentifyEnabled: true });

    const v_43c42e = await v_20bacb(v_4ac7fe, 7);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('GET');

    expect(v_43c42e).toEqual({ faceIdentifyEnabled: true });
  });

  it('전문가 클론은 faceIdentifyEnabled=false 를 그대로 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ faceIdentifyEnabled: false });

    const v_43c42e = await v_20bacb(v_4ac7fe, 8);

    expect(v_43c42e.faceIdentifyEnabled).toBe(false);
  });
});

describe('listRememberingClones', () => {
  it('GET /oth-path 를 호출하고 clones 배열을 반환한다', async () => {
    const v_6c00ce = [{ cloneId: 3, name: '한송이', username: 'hansongi', updatedAt: 1700000000 }];
    v_09509b.mockResolvedValueOnce({ clones: v_6c00ce });

    const v_43c42e = await v_a1ba62(v_4ac7fe);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('GET');

    expect(v_43c42e).toEqual({ clones: v_6c00ce });
  });
});

describe('deleteRememberingClone', () => {
  it('DELETE /oth-path 를 호출하고 삭제 카운트를 반환한다', async () => {
    v_09509b.mockResolvedValueOnce({ deletedPersons: 1, deletedVectors: 3 });

    const v_43c42e = await v_c63c1d(v_4ac7fe, 9);

    expect(v_09509b).toHaveBeenCalledTimes(1);
    const [v_9fe22d, v_21cc31, v_00cfc6] = v_09509b.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(v_9fe22d).toBe('/oth-path');
    expect(v_21cc31).toBe(v_4ac7fe);
    expect(v_00cfc6.method).toBe('DELETE');

    expect(v_43c42e).toEqual({ deletedPersons: 1, deletedVectors: 3 });
  });
});
