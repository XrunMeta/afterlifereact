import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLiveAvatar } from '../../src/realtime/useLiveAvatar';

const ticket = {
  callId: 'c1',
  subscribeUrl: 'https://o/oth-path',
  renegotiateUrl: 'https://o/oth-path',
  subscribeToken: 'tok',
  tracks: { video: 'v', audio: 'a' },
  expiresAt: 'x',
};

function makeMockPc() {
  const listeners: Record<string, Array<(p?: unknown) => void>> = {};
  return {
    connectionState: 'new',
    iceConnectionState: 'new',
    addEventListener: (ev: string, cb: (p?: unknown) => void) => {
      (listeners[ev] ||= []).push(cb);
    },
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'ANSWER' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    emit: (ev: string, payload?: unknown) => (listeners[ev] || []).forEach((cb) => cb(payload)),
  };
}

function mockSubscribeFetch() {
  global.fetch = jest.fn().mockImplementation(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(
        String(url).endsWith('/subscribe')
          ? { subscriber_session_id: 'sub1', offer_sdp: 'OFFER' }
          : { ok: true },
      ),
  })) as unknown as typeof fetch;
}

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

function deps(pc: ReturnType<typeof makeMockPc>) {
  return {
    startCall: jest.fn().mockResolvedValue(ticket),
    endCall: jest.fn().mockResolvedValue({ ok: true }),
    createPeerConnection: jest.fn().mockReturnValue(pc),
  };
}

describe('useLiveAvatar', () => {
  it('start: 티켓→pc→subscribe(토큰)→offer→answer→renegotiate(토큰) 순서', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(d.startCall).toHaveBeenCalledWith('AT', 7);
    expect(d.createPeerConnection).toHaveBeenCalled();
    const calls = (global.fetch as jest.Mock).mock.calls;
    const sub = calls.find(([u]) => String(u).endsWith('/subscribe'));
    const rng = calls.find(([u]) => String(u).endsWith('/renegotiate'));
    expect(sub[1].headers.Authorization).toBe('Bearer tok');
    expect(pc.setRemoteDescription).toHaveBeenCalled();
    expect(pc.createAnswer).toHaveBeenCalled();
    expect(rng[1].headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(rng[1].body)).toEqual({
      subscriber_session_id: 'sub1',
      answer_sdp: 'ANSWER',
    });
  });

  it('ontrack→remoteStream, ICE connected→state=live', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      pc.emit('track', { streams: [{ toURL: () => 'mock://s' }], track: { kind: 'video' } });
      pc.iceConnectionState = 'connected';
      pc.emit('iceconnectionstatechange');
    });
    await waitFor(() => expect(result.current.state).toBe('live'));
    expect(result.current.remoteStream).toBeTruthy();
  });

  it('video/audio 별도 stream — audio ontrack 이 video stream 을 덮어쓰지 않음', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    act(() => {

      pc.emit('track', {
        streams: [{ id: 'vid', toURL: () => 'v', getVideoTracks: () => [{}], getAudioTracks: () => [] }],
        track: { kind: 'video' },
      });
      pc.emit('track', {
        streams: [{ id: 'aud', toURL: () => 'a', getVideoTracks: () => [], getAudioTracks: () => [{}] }],
        track: { kind: 'audio' },
      });
    });
    await waitFor(() => expect(result.current.remoteStream).toBeTruthy());

    expect((result.current.remoteStream as unknown as { id: string }).id).toBe('vid');
  });

  it('startCall 실패 → state=error, pc 미생성', async () => {
    const d = {
      startCall: jest.fn().mockRejectedValue(new Error('boom')),
      endCall: jest.fn(),
      createPeerConnection: jest.fn(),
    };
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('error');
    expect(d.createPeerConnection).not.toHaveBeenCalled();
  });

  it('subscribe 실패 → state=error + pc.close', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'invalid_subscribe_token' }),
    }) as unknown as typeof fetch;
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('error');
    expect(pc.close).toHaveBeenCalled();
  });

  it('stop: pc.close + endCall + state=ended', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(pc.close).toHaveBeenCalled();
    expect(d.endCall).toHaveBeenCalledWith('AT', 7, 'c1');
    expect(result.current.state).toBe('ended');
  });

  it('재진입 가드: 통화 활성 중 start 재호출 → pc/startCall 1회만', async () => {
    mockSubscribeFetch();
    const pc = makeMockPc();
    const d = deps(pc);
    const { result } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(d.startCall).toHaveBeenCalledTimes(1);
    expect(d.createPeerConnection).toHaveBeenCalledTimes(1);
  });

  it('start 진행 중 언마운트 → 취소(pc 미생성, 잔류 setState 없음)', async () => {
    let resolveTicket: (v: unknown) => void = () => {};
    const d = {
      startCall: jest.fn().mockReturnValue(
        new Promise((r) => {
          resolveTicket = r;
        }),
      ),
      endCall: jest.fn().mockResolvedValue({ ok: true }),
      createPeerConnection: jest.fn().mockReturnValue(makeMockPc()),
    };
    mockSubscribeFetch();
    const { result, unmount } = renderHook(() =>
      useLiveAvatar({ cloneId: 7, accessToken: 'AT', deps: d }),
    );
    let startP: Promise<void> = Promise.resolve();
    act(() => {
      startP = result.current.start();
    });
    unmount();
    await act(async () => {
      resolveTicket(ticket);
      await startP;
    });

    expect(d.createPeerConnection).not.toHaveBeenCalled();
  });
});
