import { startCall, endCall } from '../../src/api/calls';
import { AuthApiError } from '../../src/api/auth';

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

describe('calls api', () => {
  it('startCall 은 티켓을 반환하고 Bearer accessToken 을 보낸다', async () => {
    mockFetch(200, {
      callId: 'c1',
      subscribeUrl: 'https://o/oth-path',
      renegotiateUrl: 'https://o/oth-path',
      subscribeToken: 'tok',
      tracks: { video: 'v', audio: 'a' },
      expiresAt: 'x',
    });
    const t = await startCall('AT', 7);
    expect(t.callId).toBe('c1');
    expect(t.subscribeToken).toBe('tok');
    expect(t.subscribeUrl).toContain('/oth-path');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/oth-path');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer AT');
  });

  it('startCall 503 → AuthApiError', async () => {
    mockFetch(503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'no capacity' } });
    await expect(startCall('AT', 7)).rejects.toBeInstanceOf(AuthApiError);
  });

  it('endCall 은 멱등 ok 를 반환하고 callId 경로를 친다', async () => {
    mockFetch(200, { ok: true });
    const r = await endCall('AT', 7, 'c1');
    expect(r).toEqual({ ok: true });
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/oth-path');
  });
});
