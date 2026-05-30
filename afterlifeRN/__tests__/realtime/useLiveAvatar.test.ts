import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_b38a7e } from '../../src/realtime/useLiveAvatar';

const v_c9c6be = {
  callId: 'c1',
  subscribeUrl: 'https://o/oth-path',
  renegotiateUrl: 'https://o/oth-path',
  subscribeToken: 'tok',
  tracks: { video: 'v', audio: 'a' },
  expiresAt: 'x',
};

function v_e6273b() {
  const v_9fde29 = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    addEventListener: (v_1d299c, v_16dbdb) => {
      (v_9fde29[v_1d299c] ||= []).push(v_16dbdb);
    },
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'ANSWER' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (v_1d299c, v_931bf0) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_931bf0)),
  };
}

function v_57d229() {
  global.fetch = jest.fn().mockImplementation(async (v_f71b56) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(
        String(v_f71b56).endsWith('/subscribe')
          ? { subscriber_session_id: 'sub1', offer_sdp: 'OFFER' }
          : { ok: true },
      ),
  })) as unknown as typeof fetch;
}

const v_ec9084 = global.fetch;
afterEach(() => {
  global.fetch = v_ec9084;
});

function v_84b93d(pc: ReturnType<typeof v_e6273b>) {
  return {
    startCall: jest.fn().mockResolvedValue(v_c9c6be),
    endCall: jest.fn().mockResolvedValue({ ok: true }),
    createPeerConnection: jest.fn().mockReturnValue(v_12cd99),
  };
}

describe('useLiveAvatar', () => {
  it('start: 티켓→pc→subscribe(토큰)→offer→answer→renegotiate(토큰) 순서', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_d5dda0.startCall).toHaveBeenCalledWith('AT', 7);
    expect(v_d5dda0.createPeerConnection).toHaveBeenCalled();
    const v_20e160 = (global.fetch as jest.Mock).mock.calls;
    const v_1ae212 = v_20e160.find(([v_ceb55a]) => String(v_ceb55a).endsWith('/subscribe'));
    const v_c7b9cd = v_20e160.find(([v_ceb55a]) => String(v_ceb55a).endsWith('/renegotiate'));
    expect(v_1ae212[1].headers.Authorization).toBe('Bearer tok');
    expect(v_12cd99.setRemoteDescription).toHaveBeenCalled();
    expect(v_12cd99.createAnswer).toHaveBeenCalled();
    expect(v_c7b9cd[1].headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(v_c7b9cd[1].body)).toEqual({
      subscriber_session_id: 'sub1',
      answer_sdp: 'ANSWER',
    });
  });

  it('ontrack→remoteStream, ICE connected→state=live', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    v_be73a0(() => {
      v_12cd99.emit('track', { streams: [{ toURL: () => 'mock://s' }], track: { kind: 'video' } });
      v_12cd99.iceConnectionState = 'connected';
      v_12cd99.emit('iceconnectionstatechange');
    });
    await v_81e49f(() => expect(v_43c42e.current.state).toBe('live'));
    expect(v_43c42e.current.remoteStream).toBeTruthy();
  });

  it('startCall 실패 → state=error, pc 미생성', async () => {
    const v_d5dda0 = {
      startCall: jest.fn().mockRejectedValue(new Error('boom')),
      endCall: jest.fn(),
      createPeerConnection: jest.fn(),
    };
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_43c42e.current.state).toBe('error');
    expect(v_d5dda0.createPeerConnection).not.toHaveBeenCalled();
  });

  it('subscribe 실패 → state=error + pc.close', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'invalid_subscribe_token' }),
    }) as unknown as typeof fetch;
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    expect(v_43c42e.current.state).toBe('error');
    expect(v_12cd99.close).toHaveBeenCalled();
  });

  it('stop: pc.close + endCall + state=ended', async () => {
    v_57d229();
    const v_12cd99 = v_e6273b();
    const v_d5dda0 = v_84b93d(v_12cd99);
    const { result: v_43c42e } = v_0da18b(() =>
      v_b38a7e({ cloneId: 7, accessToken: 'AT', deps: v_d5dda0 }),
    );
    await v_be73a0(async () => {
      await v_43c42e.current.start();
    });
    await v_be73a0(async () => {
      await v_43c42e.current.stop();
    });
    expect(v_12cd99.close).toHaveBeenCalled();
    expect(v_d5dda0.endCall).toHaveBeenCalledWith('AT', 7, 'c1');
    expect(v_43c42e.current.state).toBe('ended');
  });
});
