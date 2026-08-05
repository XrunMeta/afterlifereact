

import {
  createPerson,
  saveFaceConsent,
  listPersons,
  updatePersonName,
  selfConfirm,
  fetchFacePolicy,
  listRememberingClones,
  deleteRememberingClone,
} from '../../src/api/persons';

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

    const result = await createPerson(ACCESS_TOKEN, { cloneId: 1 });

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

  it('cloneId 는 항상 body 에 포함된다(person 은 클론 전속)', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 1, consentState: 'none' });

    await createPerson(ACCESS_TOKEN, { cloneId: 5 });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toHaveProperty('cloneId', 5);
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

  it('cloneId 지정 시 쿼리스트링에 실어 GET /oth-path?cloneId= 를 호출한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ data: [] });

    await listPersons(ACCESS_TOKEN, 10);

    const [path] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path?cloneId=10');
  });
});

describe('updatePersonName', () => {
  it('PATCH /oth-path 를 displayName body와 함께 호출', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 42, displayName: '민지' });

    const result = await updatePersonName(ACCESS_TOKEN, 42, '민지');

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('PATCH');

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.displayName).toBe('민지');
    expect(result).toEqual({ id: 42, displayName: '민지' });
  });
});

describe('createPerson enrolledVia', () => {
  it('enrolledVia 를 넘기면 body 에 포함된다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 9, consentState: 'granted' });

    await createPerson(ACCESS_TOKEN, { cloneId: 1, enrolledVia: 'auto_biometric' });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.enrolledVia).toBe('auto_biometric');
  });

  it('enrolledVia 없이 호출하면 body 에 포함되지 않는다(회귀)', async () => {
    mockAuthFetch.mockResolvedValueOnce({ id: 10, consentState: 'none' });

    await createPerson(ACCESS_TOKEN, { cloneId: 1 });

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('enrolledVia');
  });
});

describe('selfConfirm', () => {
  it('POST /oth-path 을 vectors 와 함께 호출하고 {personId, selfPersonId} 를 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ personId: 11, selfPersonId: 11 });
    const vectors = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ];

    const result = await selfConfirm(ACCESS_TOKEN, 5, vectors);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.vectors).toEqual(vectors);
    expect(body).not.toHaveProperty('displayName');

    expect(result).toEqual({ personId: 11, selfPersonId: 11 });
  });

  it('displayName 을 넘기면 body 에 포함된다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ personId: 12, selfPersonId: 12 });

    await selfConfirm(ACCESS_TOKEN, 5, [[1, 0], [1, 0], [1, 0]], '민지');

    const [, , init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.displayName).toBe('민지');
  });

  it('409(CONFLICT) 등 authFetch 실패는 그대로 전파한다(호출부가 분류)', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('CONFLICT'));

    await expect(selfConfirm(ACCESS_TOKEN, 5, [[1], [1], [1]])).rejects.toThrow('CONFLICT');
  });
});

describe('fetchFacePolicy', () => {
  it('GET /oth-path 를 호출하고 faceIdentifyEnabled 를 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ faceIdentifyEnabled: true });

    const result = await fetchFacePolicy(ACCESS_TOKEN, 7);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('GET');

    expect(result).toEqual({ faceIdentifyEnabled: true });
  });

  it('전문가 클론은 faceIdentifyEnabled=false 를 그대로 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ faceIdentifyEnabled: false });

    const result = await fetchFacePolicy(ACCESS_TOKEN, 8);

    expect(result.faceIdentifyEnabled).toBe(false);
  });
});

describe('listRememberingClones', () => {
  it('GET /oth-path 를 호출하고 clones 배열을 반환한다', async () => {
    const mockClones = [{ cloneId: 3, name: '한송이', username: 'hansongi', updatedAt: 1700000000 }];
    mockAuthFetch.mockResolvedValueOnce({ clones: mockClones });

    const result = await listRememberingClones(ACCESS_TOKEN);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('GET');

    expect(result).toEqual({ clones: mockClones });
  });
});

describe('deleteRememberingClone', () => {
  it('DELETE /oth-path 를 호출하고 삭제 카운트를 반환한다', async () => {
    mockAuthFetch.mockResolvedValueOnce({ deletedPersons: 1, deletedVectors: 3 });

    const result = await deleteRememberingClone(ACCESS_TOKEN, 9);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, token, init] = mockAuthFetch.mock.calls[0] as unknown as [string, string, RequestInit, ...unknown[]];
    expect(path).toBe('/oth-path');
    expect(token).toBe(ACCESS_TOKEN);
    expect(init.method).toBe('DELETE');

    expect(result).toEqual({ deletedPersons: 1, deletedVectors: 3 });
  });
});
