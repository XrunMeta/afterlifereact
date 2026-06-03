import { v_53975b, v_51c671 } from '../../src/api/calls';
import { v_84a859 } from '../../src/api/auth';

const v_ec9084 = global.fetch;
afterEach(() => {
  global.fetch = v_ec9084;
});

function v_b2671c(v_d308b5, v_4d33b2) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: v_d308b5 >= 200 && v_d308b5 < 300,
    status: v_d308b5,
    text: async () => JSON.stringify(v_4d33b2),
  }) as unknown as typeof fetch;
}

describe('calls api', () => {
  it('startCall 은 티켓을 반환하고 Bearer accessToken 을 보낸다', async () => {
    v_b2671c(200, {
      callId: 'c1',
      subscribeUrl: 'https://o/oth-path',
      renegotiateUrl: 'https://o/oth-path',
      subscribeToken: 'tok',
      tracks: { video: 'v', audio: 'a' },
      expiresAt: 'x',
    });
    const v_8d41d7 = await v_53975b('AT', 7);
    expect(v_8d41d7.callId).toBe('c1');
    expect(v_8d41d7.subscribeToken).toBe('tok');
    expect(v_8d41d7.subscribeUrl).toContain('/oth-path');
    const [v_f71b56, v_00cfc6] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(v_f71b56)).toContain('/oth-path');
    expect((v_00cfc6.headers as Record<string, string>).Authorization).toBe('Bearer AT');
  });

  it('startCall 503 → AuthApiError', async () => {
    v_b2671c(503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'no capacity' } });
    await expect(v_53975b('AT', 7)).rejects.toBeInstanceOf(v_84a859);
  });

  it('endCall 은 멱등 ok 를 반환하고 callId 경로를 친다', async () => {
    v_b2671c(200, { ok: true });
    const v_cb35cb = await v_51c671('AT', 7, 'c1');
    expect(v_cb35cb).toEqual({ ok: true });
    const [v_f71b56] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(v_f71b56)).toContain('/oth-path');
  });
});
